import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { query } from './db';

const COOKIE = 'cu_token';

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'cu-dev-secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'cu-dev-secret');
  } catch {
    return null;
  }
}

export function setAuthCookie(token) {
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAuthCookie() {
  cookies().set(COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

/** Returns the signed-in user row (without password) or null. */
export async function getSessionUser() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload?.id) return null;
  const rows = await query(
    `SELECT id, name, email, role, status, analysis_count, created_at, last_login_at
       FROM users WHERE id = ? LIMIT 1`,
    [payload.id]
  );
  return rows[0] || null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    const err = new Error('Authentication required');
    err.status = 401;
    throw err;
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'admin') {
    const err = new Error('Admin access required');
    err.status = 403;
    throw err;
  }
  return user;
}
