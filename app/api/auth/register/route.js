import { NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (name.length < 2) return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Please enter a valid email.' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });

    const existing = await query(`SELECT id FROM users WHERE email = ? LIMIT 1`, [email]);
    if (existing.length) return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });

    const hash = await hashPassword(password);

    // users + profile insert lives in a transaction; the profile row is also
    // auto-created by trg_users_after_insert (ON CONFLICT handled by INSERT IGNORE)
    const userId = await transaction(async (conn) => {
      const [result] = await conn.query(
        `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'user')`,
        [name, email, hash]
      );
      await conn.query(
        `INSERT INTO user_profiles (user_id, headline, avatar_seed) VALUES (?, 'Curious about the cost of code', SUBSTRING(MD5(?),1,12))
         ON DUPLICATE KEY UPDATE headline = VALUES(headline)`,
        [result.insertId, email]
      );
      return result.insertId;
    });

    const token = signToken({ id: userId, role: 'user' });
    await setAuthCookie(token);

    return NextResponse.json({
      user: { id: userId, name, email, role: 'user' },
    });
  } catch (err) {
    console.error('register error:', err);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
