/**
 * ComplexityUniverse — database bootstrap for Aiven MySQL.
 * Runs database/schema.sql (tables, views, triggers) then
 * database/seed.sql (topics, examples, AI prompt) and seeds demo users.
 *
 * Connection settings (including SSL/TLS) are read from .env.local.
 *
 * Usage:  npm run db:setup
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
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

/** Ensure .env.local exists with an Aiven MySQL template if missing. */
function ensureEnvFile() {
  const envPath = path.join(root, '.env.local');
  if (existsSync(envPath)) return;

  const jwt = [...Array(24)].map(() => 'abcdef0123456789'[Math.floor(Math.random() * 16)]).join('');
  writeFileSync(
    envPath,
    `# --- Aiven MySQL ---
# Copy these values from your Aiven Console (Service -> Overview -> Connection information)
DB_HOST=
DB_PORT=10275
DB_USER=avnadmin
DB_PASSWORD=
DB_NAME=complexity_universe
DB_SSL=true
DB_CA_CERT=./ca.pem

# --- Auth ---
JWT_SECRET=${jwt}
JWT_EXPIRES_IN=7d
`
  );
  console.log('Created .env.local template for Aiven MySQL.');
}

/** Connect to Aiven MySQL. */
async function connect() {
  const config = buildMysqlConfig(env, { withDatabase: false });

  if (!config.host || !config.password) {
    console.error(
      'Missing Aiven MySQL configuration in .env.local.\n' +
        'Please check that DB_HOST, DB_PORT, DB_USER, and DB_PASSWORD are set.\n' +
        'You can copy these directly from your Aiven Console (Service -> Connection information).'
    );
    process.exit(1);
  }

  try {
    return await mysql.createConnection(config);
  } catch (err) {
    const msg = err.message || '';
    if (/ECONNREFUSED|ETIMEDOUT|ENOTFOUND|EAI_AGAIN/i.test(msg)) {
      console.error(
        `Cannot reach the Aiven MySQL server at ${config.host}:${config.port}.\n` +
          `- Verify your Aiven service is Running in the Aiven Console.\n` +
          `- Check that DB_HOST and DB_PORT in .env.local match your Aiven connection info.\n` +
          `- Check your internet connection or firewall settings.`
      );
      process.exit(1);
    }
    if (/ER_ACCESS_DENIED/i.test(msg)) {
      console.error(
        `Access denied for user '${config.user}' on Aiven MySQL.\n` +
          `- Check that DB_USER and DB_PASSWORD in .env.local match the credentials in your Aiven Console.`
      );
      process.exit(1);
    }
    if (/HANDSHAKE|SSL|TLS/i.test(msg)) {
      console.error(
        `TLS/SSL connection error connecting to Aiven (${config.host}):\n${msg}\n` +
          `- Ensure ca.pem is present in the project root, or set DB_CA_CERT=./ca.pem in .env.local.`
      );
      process.exit(1);
    }
    throw err;
  }
}

/** Split a .sql file into executable statements. */
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
  const dbName = (env.DB_NAME || 'complexity_universe').trim();
  console.log(`Connecting to Aiven MySQL at ${env.DB_HOST}:${env.DB_PORT || 10275} as ${env.DB_USER || 'avnadmin'} ...`);
  const conn = await connect();

  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\`
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await conn.query(`USE \`${dbName}\``);

  console.log('Applying schema.sql to Aiven MySQL ...');
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

  // sample bookmarks for demo user
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
  console.log('Aiven MySQL setup complete:', counts[0]);
  await conn.end();
}

main().catch((err) => {
  console.error('Aiven MySQL setup failed:', err.message);
  process.exit(1);
});
