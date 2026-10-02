import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword, signToken, setAuthCookie } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const rows = await query(
      `SELECT id, name, email, password_hash, role, status FROM users WHERE email = ? LIMIT 1`,
      [email]
    );
    const user = rows[0];
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });
    }
    if (user.status === 'suspended') {
      return NextResponse.json({ error: 'This account is suspended.' }, { status: 403 });
    }

    await query(`UPDATE users SET last_login_at = NOW() WHERE id = ?`, [user.id]);

    const token = signToken({ id: user.id, role: user.role });
    setAuthCookie(token);

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('login error:', err);
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
