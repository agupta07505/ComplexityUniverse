import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

/** GET /api/profile — dashboard identity block (v_user_overview + counters). */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });

  const rows = await query(`SELECT * FROM v_user_overview WHERE id = ? LIMIT 1`, [user.id]);
  const stats = await query(
    `SELECT
       (SELECT COUNT(*) FROM code_analyses WHERE user_id = ?)                      AS total_analyses,
       (SELECT COUNT(*) FROM user_saved_topics WHERE user_id = ?)                  AS saved_topics,
       (SELECT COUNT(DISTINCT language) FROM code_analyses WHERE user_id = ?)      AS languages_used,
       (SELECT COALESCE(SUM(code_lines), 0) FROM code_analyses WHERE user_id = ?)  AS lines_analyzed,
       (SELECT COUNT(*) FROM code_analyses
         WHERE user_id = ? AND time_complexity IN ('O(1)','O(log n)'))             AS efficient_count,
       (SELECT time_complexity FROM code_analyses WHERE user_id = ?
         GROUP BY time_complexity ORDER BY COUNT(*) DESC, time_complexity LIMIT 1) AS most_common_complexity`,
    [user.id, user.id, user.id, user.id, user.id, user.id]
  );
  return NextResponse.json({ profile: rows[0] || null, stats: stats?.[0] || null });
}

/** PUT /api/profile — update the editable profile fields. */
export async function PUT(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });

  const b = await request.json();
  const name = String(b.name || user.name).trim().slice(0, 100);
  const headline = String(b.headline || '').trim().slice(0, 140);
  const bio = String(b.bio || '').trim().slice(0, 500);
  const location = String(b.location || '').trim().slice(0, 100);

  await query(`UPDATE users SET name = ? WHERE id = ?`, [name, user.id]);
  await query(
    `UPDATE user_profiles SET headline = ?, bio = ?, location = ? WHERE user_id = ?`,
    [headline, bio, location, user.id]
  );

  return NextResponse.json({ ok: true });
}
