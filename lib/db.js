import mysql from 'mysql2/promise';
import path from 'node:path';
import { readEnvFile, buildMysqlConfig } from './mysql-config.mjs';

/**
 * Shared Aiven MySQL connection pool.
 * The pool is cached on globalThis so Next.js hot-reload does not leak connections.
 *
 * Connection settings (with TLS/SSL for Aiven MySQL) are loaded from .env.local.
 */
function createPool() {
  const envFromFile = readEnvFile(path.resolve(process.cwd(), '.env.local'));
  const env = { ...envFromFile, ...process.env };
  return mysql.createPool(buildMysqlConfig(env));
}

export function getPool() {
  if (!globalThis.__cuPool) globalThis.__cuPool = createPool();
  return globalThis.__cuPool;
}

/** Run a single statement, return rows. */
export async function query(sql, params = []) {
  const [rows] = await getPool().query(sql, params);
  return rows;
}

/** Run several statements inside one transaction. */
export async function transaction(work) {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export default getPool;
