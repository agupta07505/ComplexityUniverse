/**
 * Shared MySQL connection settings for the app (lib/db.js) and the
 * database bootstrap (scripts/setup-db.mjs).
 *
 * Works with a local MySQL/XAMPP install AND with online services
 * like Aiven, which require an SSL/TLS connection.
 *
 * Environment variables (.env.local):
 *   DB_HOST       server hostname   (Aiven: something like mysql-12345.aivencloud.com)
 *   DB_PORT       server port       (Aiven: a custom port, e.g. 17xxx)
 *   DB_USER       user name         (Aiven: usually avnadmin)
 *   DB_PASSWORD   password
 *   DB_NAME       database name     (default: complexity_universe)
 *   DB_SSL        true / false      (auto: on for remote hosts, off for localhost)
 *   DB_CA_CERT    optional TLS certificate:
 *                 - full PEM text (-----BEGIN CERTIFICATE----- ...)
 *                 - or the path to a ca.pem file
 *                 When omitted, TLS is still used but the certificate is not
 *                 verified (fine for class projects; set it for full verification).
 */

import { readFileSync } from 'node:fs';

const LOCAL_HOSTS = ['127.0.0.1', 'localhost', '::1'];

export function readEnvFile(path) {
  const env = {};
  try {
    const raw = readFileSync(path, 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !line.trim().startsWith('#')) env[m[1]] = m[2];
    }
  } catch {
    /* no .env.local — fall back to process.env */
  }
  return env;
}

/** Build the mysql2 `ssl` option (or undefined when SSL is off). */
export function buildSslOption(env) {
  const host = (env.DB_HOST || '127.0.0.1').trim();
  const flag = (env.DB_SSL || '').trim().toLowerCase();

  let useSsl;
  if (flag === 'true' || flag === '1' || flag === 'required') useSsl = true;
  else if (flag === 'false' || flag === '0' || flag === 'off') useSsl = false;
  else useSsl = !LOCAL_HOSTS.includes(host); // auto: remote host (e.g. Aiven) -> TLS on

  if (!useSsl) return undefined;

  const caRaw = (env.DB_CA_CERT || '').trim();
  if (!caRaw) {
    // encrypted connection, certificate not verified
    return { rejectUnauthorized: false };
  }

  let ca = caRaw.replace(/\\n/g, '\n');
  if (!ca.includes('BEGIN CERTIFICATE')) {
    // treat the value as a file path (e.g. ./ca.pem)
    try {
      ca = readFileSync(ca, 'utf8');
    } catch {
      throw new Error(`DB_CA_CERT looks like a file path but could not be read: ${caRaw}`);
    }
  }
  return { ca, rejectUnauthorized: true };
}

/** Build a mysql2 connection/pool config. */
export function buildMysqlConfig(env, { withDatabase = true } = {}) {
  const config = {
    host: (env.DB_HOST || '127.0.0.1').trim(),
    port: Number(env.DB_PORT || 3306),
    user: (env.DB_USER || 'cu_app').trim(),
    password: env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true,
    charset: 'utf8mb4',
    connectTimeout: 20000,
  };
  if (withDatabase) config.database = (env.DB_NAME || 'complexity_universe').trim();

  const ssl = buildSslOption(env);
  if (ssl) config.ssl = ssl;

  return config;
}
