import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

/**
 * POST /api/topics/[id]/save — toggle a Learn-page bookmark.
 * INSERT ... ON DUPLICATE KEY UPDATE + DELETE keeps one row per (user, topic);
 * triggers write both events to activity_log.
 */
export async function POST(request, { params }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in to save topics.' }, { status: 401 });

  const topicId = Number(params.id);
  const body = await request.json().catch(() => ({}));
  const note = String(body.note || '').slice(0, 255);

  const topic = await query(`SELECT id FROM complexity_topics WHERE id = ? LIMIT 1`, [topicId]);
  if (!topic.length) return NextResponse.json({ error: 'Topic not found.' }, { status: 404 });

  const existing = await query(
    `SELECT id FROM user_saved_topics WHERE user_id = ? AND topic_id = ? LIMIT 1`,
    [user.id, topicId]
  );

  if (existing.length) {
    await query(`DELETE FROM user_saved_topics WHERE user_id = ? AND topic_id = ?`, [user.id, topicId]);
    return NextResponse.json({ saved: false });
  }

  await query(
    `INSERT INTO user_saved_topics (user_id, topic_id, note) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE note = VALUES(note), saved_at = CURRENT_TIMESTAMP`,
    [user.id, topicId, note]
  );
  return NextResponse.json({ saved: true });
}
