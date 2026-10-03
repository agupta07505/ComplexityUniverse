/**
 * Aiven MySQL connection settings for ComplexityUniverse.
 * Used by lib/db.js (app runtime) and scripts/setup-db.mjs (bootstrap).
 *
 * Environment variables (.env.local):
 *   DB_HOST       Aiven host (e.g. mysql-xxxxx.aivencloud.com)
 *   DB_PORT       Aiven port (e.g. 10275)
 *   DB_USER       Aiven username (usually avnadmin)
 *   DB_PASSWORD   Aiven password
 *   DB_NAME       database name (default: complexity_universe)
 *   DB_SSL        true / false (default: true for Aiven)
 *   DB_CA_CERT    path to ca.pem or CA PEM string (optional, defaults to ./ca.pem if present)
 */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

export function readEnvFile(filepath) {
  const env = {};
  try {
    const raw = readFileSync(filepath, 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !line.trim().startsWith('#')) {
        let val = m[2].trim();
        // remove surrounding quotes if any
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        env[m[1]] = val;
      }
    }
  } catch {
    /* fallback to process.env */
  }
  return env;
}

/** Build the mysql2 `ssl` option for Aiven. */
export function buildSslOption(env) {
  const flag = (env.DB_SSL || '').trim().toLowerCase();
  if (flag === 'false' || flag === '0' || flag === 'off') {
    return undefined;
  }

  // Look for ca certificate
  let caRaw = (env.DB_CA_CERT || '').trim();

  // If DB_CA_CERT is not provided or points to a non-existent path, check if ca.pem exists in project root
  if (!caRaw || (!caRaw.includes('BEGIN CERTIFICATE') && !existsSync(/*turbopackIgnore: true*/ caRaw))) {
    const defaultCaPath = path.resolve(/*turbopackIgnore: true*/ process.cwd(), 'ca.pem');
    if (existsSync(/*turbopackIgnore: true*/ defaultCaPath)) {
      caRaw = defaultCaPath;
    }
  }

  if (!caRaw) {
    // Encrypted connection without CA verification
    return { rejectUnauthorized: false };
  }

  let ca = caRaw.replace(/\\n/g, '\n');
  if (!ca.includes('BEGIN CERTIFICATE')) {
    try {
      const resolvedPath = path.isAbsolute(ca) ? ca : path.resolve(/*turbopackIgnore: true*/ process.cwd(), ca);
      ca = readFileSync(resolvedPath, 'utf8');
    } catch {
      // If path couldn't be read, still connect securely without certificate verification
      return { rejectUnauthorized: false };
    }
  }

  return { ca, rejectUnauthorized: true };
}

/** Build mysql2 connection/pool configuration for Aiven MySQL. */
export function buildMysqlConfig(env, { withDatabase = true } = {}) {
  const config = {
    host: (env.DB_HOST || '').trim(),
    port: Number(env.DB_PORT || 10275),
    user: (env.DB_USER || 'avnadmin').trim(),
    password: env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true,
    charset: 'utf8mb4',
    connectTimeout: 20000,
  };

  if (withDatabase) {
    config.database = (env.DB_NAME || 'complexity_universe').trim();
  }

  const ssl = buildSslOption(env);
  if (ssl) {
    config.ssl = ssl;
  }

  return config;
}
