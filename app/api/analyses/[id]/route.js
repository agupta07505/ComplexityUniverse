import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

/** GET one analysis (with full detail payload). */
export async function GET(request, { params }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });

  const resolvedParams = await params;
  const rows = await query(
    `SELECT * FROM code_analyses WHERE id = ? AND user_id = ? LIMIT 1`,
    [resolvedParams.id, user.id]
  );
  if (!rows.length) return NextResponse.json({ error: 'Analysis not found.' }, { status: 404 });
  return NextResponse.json({ analysis: rows[0] });
}

/** DELETE — trg_analyses_after_delete decrements the counter and logs. */
export async function DELETE(request, { params }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });

  const resolvedParams = await params;
  const result = await query(`DELETE FROM code_analyses WHERE id = ? AND user_id = ?`, [resolvedParams.id, user.id]);
  if (!result.affectedRows) return NextResponse.json({ error: 'Analysis not found.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
