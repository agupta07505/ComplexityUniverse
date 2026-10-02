import { NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

/** PUT — update a topic (CASE-based publish toggle + column updates). */
export async function PUT(request, { params }) {
  try {
    await requireAdmin();
    const b = await request.json();
    const id = Number(params.id);

    await query(
      `UPDATE complexity_topics
          SET topic_name       = ?,
              category         = ?,
              difficulty       = ?,
              time_complexity  = ?,
              space_complexity = ?,
              summary          = ?,
              notes_html       = ?,
              sort_order       = ?,
              is_published     = CASE WHEN ? = 1 THEN 1 ELSE 0 END
        WHERE id = ?`,
      [
        String(b.topic_name || '').trim(),
        String(b.category || 'Fundamentals').slice(0, 60),
        ['Beginner', 'Intermediate', 'Advanced'].includes(b.difficulty) ? b.difficulty : 'Beginner',
        String(b.time_complexity || '').slice(0, 40) || null,
        String(b.space_complexity || '').slice(0, 40) || null,
        String(b.summary || '').slice(0, 300),
        String(b.notes_html || '<p>Notes coming soon.</p>'),
        Number(b.sort_order) || 100,
        b.is_published === false ? 0 : 1,
        id,
      ]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

/** DELETE — plain transaction: bookmarks first, then the topic
 *  (topic_examples rows are removed by ON DELETE CASCADE). */
export async function DELETE(request, { params }) {
  try {
    const admin = await requireAdmin();
    const id = Number(params.id);

    await transaction(async (conn) => {
      const [topicRows] = await conn.query(
        `SELECT topic_name FROM complexity_topics WHERE id = ? FOR UPDATE`,
        [id]
      );
      await conn.query(`DELETE FROM user_saved_topics WHERE topic_id = ?`, [id]);
      await conn.query(`DELETE FROM complexity_topics WHERE id = ?`, [id]);
      await conn.query(
        `INSERT INTO activity_log (user_id, action, entity, entity_id, detail)
         VALUES (?, 'topic_removed', 'complexity_topics', ?, ?)`,
        [admin.id, id, topicRows[0]?.topic_name || '']
      );
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
