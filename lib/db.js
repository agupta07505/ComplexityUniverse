import mysql from 'mysql2/promise';
import { buildMysqlConfig } from './mysql-config.mjs';

/**
 * Shared MySQL connection pool.
 * The pool is cached on globalThis so Next.js hot-reload does not leak connections.
 *
 * Connection settings (including SSL for online databases like Aiven) live in
 * lib/mysql-config.mjs and are configured through .env.local.
 */
function createPool() {
  return mysql.createPool(buildMysqlConfig(process.env));
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
