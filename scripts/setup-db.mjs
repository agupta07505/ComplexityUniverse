/**
 * ComplexityUniverse — database bootstrap.
 * Runs database/schema.sql (tables, views, triggers) then
 * database/seed.sql (topics, examples, AI prompt) and seeds demo users.
 *
 * Works with local MySQL/XAMPP and online databases (e.g. Aiven) —
 * the connection (including SSL) is read from .env.local.
 *
 * Usage:  npm run db:setup   (or run setup.bat / setup.sh)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { readEnvFile, buildMysqlConfig } from '../lib/mysql-config.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv() {
  const fileEnv = readEnvFile(path.join(root, '.env.local'));
  return { ...fileEnv, ...process.env };
}

const env = loadEnv();
const config = buildMysqlConfig(env, { withDatabase: false });

/** Write a default .env.local when one does not exist yet. */
function ensureEnvFile() {
  const envPath = path.join(root, '.env.local');
  try {
    readFileSync(envPath);
    return; // already there
  } catch {
    /* create it */
  }
  const jwt = [...Array(24)].map(() => 'abcdef0123456789'[Math.floor(Math.random() * 16)]).join('');
  writeFileSync(
    envPath,
    `# --- MySQL ---
# Local MySQL/XAMPP (default):
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=cu_app
DB_PASSWORD=cu_app_2026
DB_NAME=complexity_universe
# DB_SSL=false

# --- Using Aiven (online MySQL)? ---
# Copy these values from the Aiven console (Service -> Connection information)
# and replace the ones above. SSL turns on automatically for remote hosts.
# DB_HOST=mysql-12345.aivencloud.com
# DB_PORT=17xxx
# DB_USER=avnadmin
# DB_PASSWORD=your-aiven-password
# DB_NAME=defaultdb
# DB_SSL=true
# DB_CA_CERT=          (optional) paste the PEM text from Aiven, or path to ca.pem

# --- Auth ---
JWT_SECRET=${jwt}
JWT_EXPIRES_IN=7d

# NOTE: the Gemini API key is set inside the website
# (Admin -> AI settings), not here.
`
  );
  console.log('Created .env.local with default settings.');
}

/**
 * Connect to MySQL. If the configured account does not exist yet (fresh PC),
 * try the default root account (XAMPP / WAMP / Laragon) and create it.
 * Online databases (Aiven etc.) use the credentials from .env.local directly.
 */
async function connect() {
  try {
    return await mysql.createConnection(config);
  } catch (err) {
    const msg = err.message || '';
    if (/ECONNREFUSED|ETIMEDOUT|ENOTFOUND|EAI_AGAIN/i.test(msg)) {
      console.error(
        `Cannot reach the MySQL server at ${config.host}:${config.port}.\n` +
          `- Local MySQL/XAMPP: start MySQL first (XAMPP -> Start next to MySQL).\n` +
          `- Aiven / online MySQL: check DB_HOST and DB_PORT in .env.local\n` +
          `  (copy them from the Aiven console -> Connection information).`
      );
      process.exit(1);
    }
    if (!/ER_ACCESS_DENIED|ER_NOT_SUPPORTED_AUTH_MODE|HANDSHAKE|SSL|TLS/i.test(msg)) throw err;
    if (/HANDSHAKE|SSL|TLS/i.test(msg)) {
      console.error(
        `TLS/SSL problem while connecting to ${config.host}:\n${msg}\n` +
          `For Aiven: leave DB_SSL empty (TLS turns on automatically) or set DB_SSL=true.\n` +
          `If the certificate cannot be verified, set DB_SSL=true and leave DB_CA_CERT empty,\n` +
          `or paste Aiven's CA certificate into DB_CA_CERT in .env.local.`
      );
      process.exit(1);
    }
  }
  console.log('Configured MySQL user not accepted — trying root to create it automatically ...');
  for (const rootPw of ['', 'root', 'password']) {
    try {
      const rootConn = await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: 'root',
        password: rootPw,
      });
      await rootConn.query(
        `CREATE USER IF NOT EXISTS '${config.user}'@'%' IDENTIFIED BY '${config.password}'`
      );
      await rootConn.query(
        `CREATE USER IF NOT EXISTS '${config.user}'@'localhost' IDENTIFIED BY '${config.password}'`
      );
      await rootConn.query(`GRANT ALL PRIVILEGES ON *.* TO '${config.user}'@'%'`);
      await rootConn.query(`GRANT ALL PRIVILEGES ON *.* TO '${config.user}'@'localhost'`);
      await rootConn.query('FLUSH PRIVILEGES');
      await rootConn.end();
      console.log(`MySQL user '${config.user}' created — continuing.`);
      return mysql.createConnection(config);
    } catch {
      /* try the next root password */
    }
  }
  console.error(
    `Could not log in to MySQL.\n` +
      `- Local MySQL/XAMPP: open .env.local and set DB_USER / DB_PASSWORD to your MySQL account.\n` +
      `- Aiven: open the Aiven console -> Service -> Connection information and copy\n` +
      `  the exact User, Password, Host and Port into .env.local.\n` +
      `Then rerun this setup.`
  );
  process.exit(1);
}

/** Split a .sql file into executable statements.
 *  Handles DELIMITER blocks and skips delimiters inside quoted strings
 *  (code samples in seed.sql contain semicolons). */
export function splitSql(raw) {
  const statements = [];
  let delimiter = ';';
  let buf = '';
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let inLineComment = false;
  let inBlockComment = false;
  let atLineStart = true;

  const flush = () => {
    const stmt = buf.trim();
    if (stmt) statements.push(stmt);
    buf = '';
  };

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    const next = raw[i + 1];

    if (inLineComment) {
      buf += ch;
      if (ch === '\n') {
        inLineComment = false;
        atLineStart = true;
      } else atLineStart = false;
      continue;
    }
    if (inBlockComment) {
      buf += ch;
      if (ch === '*' && next === '/') {
        buf += '/';
        i++;
      }
      atLineStart = ch === '\n';
      continue;
    }

    // DELIMITER directive (only at line start, outside strings/comments)
    if (atLineStart && !inSingle && !inDouble && !inBacktick) {
      const rest = raw.slice(i);
      const m = rest.match(/^DELIMITER[ \t]+(\S+)[ \t]*\r?\n?/i);
      if (m) {
        if (buf.trim()) statements.push(buf.trim());
        buf = '';
        delimiter = m[1];
        i += m[0].length - 1;
        atLineStart = true;
        continue;
      }
    }

    if (!inDouble && !inBacktick && ch === "'" && !inBlockComment) {
      if (inSingle && next === "'") {
        buf += "''";
        i++;
        atLineStart = false;
        continue;
      }
      inSingle = !inSingle;
      buf += ch;
      atLineStart = false;
      continue;
    }
    if (!inSingle && !inBacktick && ch === '"' && !inBlockComment) {
      if (inDouble && next === '"') {
        buf += '""';
        i++;
        atLineStart = false;
        continue;
      }
      inDouble = !inDouble;
      buf += ch;
      atLineStart = false;
      continue;
    }
    if (!inSingle && !inDouble && ch === '`') {
      inBacktick = !inBacktick;
      buf += ch;
      atLineStart = false;
      continue;
    }

    if (!inSingle && !inDouble && !inBacktick) {
      if (ch === '-' && next === '-') {
        inLineComment = true;
        buf += ch;
        atLineStart = false;
        continue;
      }
      if (ch === '#') {
        inLineComment = true;
        buf += ch;
        atLineStart = false;
        continue;
      }
      if (ch === '/' && next === '*') {
        inBlockComment = true;
        buf += ch;
        continue;
      }
      if (raw.startsWith(delimiter, i)) {
        flush();
        i += delimiter.length - 1;
        atLineStart = true;
        continue;
      }
    }

    buf += ch;
    atLineStart = ch === '\n';
  }
  if (buf.trim()) statements.push(buf.trim());
  return statements;
}

async function runFile(conn, file) {
  const raw = readFileSync(path.join(root, 'database', file), 'utf8');
  const stmts = splitSql(raw);
  for (const stmt of stmts) {
    const head = stmt.replace(/^\s*--.*$/gm, '').trim().slice(0, 40).toUpperCase();
    try {
      await conn.query(stmt);
      if (head.startsWith('CREATE TRIGGER')) console.log('   + trigger');
      else if (head.startsWith('CREATE PROCEDURE')) console.log('   + procedure');
      else if (head.startsWith('CREATE OR REPLACE VIEW') || head.startsWith('CREATE VIEW')) console.log('   + view');
    } catch (err) {
      console.error(`   ! failed on: ${head}...`);
      throw err;
    }
  }
  return stmts.length;
}

async function main() {
  ensureEnvFile();
  console.log(`Connecting to MySQL at ${config.host}:${config.port} as ${config.user} ...`);
  const conn = await connect();

  await conn.query(
    `CREATE DATABASE IF NOT EXISTS ${env.DB_NAME || 'complexity_universe'}
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await conn.query(`USE ${env.DB_NAME || 'complexity_universe'}`);

  console.log('Applying schema.sql ...');
  await runFile(conn, 'schema.sql');

  console.log('Applying seed.sql ...');
  await runFile(conn, 'seed.sql');

  console.log('Seeding users ...');
  const users = [
    { name: 'Site Admin', email: 'admin@complexityuniverse.dev', password: 'admin123', role: 'admin' },
    { name: 'Demo Analyst', email: 'demo@complexityuniverse.dev', password: 'demo1234', role: 'user' },
    { name: 'Priya Sharma', email: 'priya@example.com', password: 'priya1234', role: 'user' },
    { name: 'Arjun Mehta', email: 'arjun@example.com', password: 'arjun1234', role: 'user' },
  ];
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    await conn.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role)`,
      [u.name, u.email, hash, u.role]
    );
  }

  // a few bookmarks so the dashboard is not empty on first login
  const [demoRows] = await conn.query(`SELECT id FROM users WHERE email = 'demo@complexityuniverse.dev'`);
  if (demoRows.length) {
    const uid = demoRows[0].id;
    await conn.query(
      `INSERT IGNORE INTO user_saved_topics (user_id, topic_id, note) VALUES
       (?, 3, 'Revise before interviews'), (?, 5, 'Sorting is everywhere'), (?, 12, 'Window trick is neat')`,
      [uid, uid, uid]
    );
    await conn.query(
      `INSERT INTO code_analyses
        (user_id, title, language, code_text, time_complexity, space_complexity, summary, detailed_analysis, detail_mode, engine, prompt_version)
       SELECT ?, 'Sample — binary search', 'javascript',
              'function bs(a, t) {\n  let lo = 0, hi = a.length - 1;\n  while (lo <= hi) {\n    const mid = (lo + hi) >> 1;\n    if (a[mid] === t) return mid;\n    if (a[mid] < t) lo = mid + 1; else hi = mid - 1;\n  }\n  return -1;\n}',
              'O(log n)', 'O(1)',
              'Halves the search window each step.',
              '{"approach":"Binary search over a sorted array.","breakdown":[{"label":"while loop","detail":"window halves every iteration","cost":"O(log n)"}],"cases":{"best":"O(1)","average":"O(log n)","worst":"O(log n)"},"bottlenecks":["input must be sorted"],"optimizations":["keep the array sorted across queries"],"notes":""}',
              'detailed', 'gemini', 1
       FROM DUAL
       WHERE NOT EXISTS (SELECT 1 FROM code_analyses WHERE user_id = ? AND title = 'Sample — binary search')`,
      [uid, uid]
    );
  }

  const [counts] = await conn.query(
    `SELECT (SELECT COUNT(*) FROM complexity_topics)  AS topics,
            (SELECT COUNT(*) FROM topic_examples)     AS examples,
            (SELECT COUNT(*) FROM users)              AS users,
            (SELECT COUNT(*) FROM analysis_prompts)   AS prompts`
  );
  console.log('Done.', counts[0]);
  await conn.end();
}

main().catch((err) => {
  console.error('Database setup failed:', err.message);
  process.exit(1);
});
