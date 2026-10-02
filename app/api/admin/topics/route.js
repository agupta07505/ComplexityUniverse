import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

/** GET — all topics (including drafts) with counters. */
export async function GET() {
  try {
    await requireAdmin();
    const topics = await query(
      `SELECT t.*, v.example_count, v.saved_count
         FROM complexity_topics t
         LEFT JOIN v_topic_overview v ON v.id = t.id
        ORDER BY t.sort_order, t.topic_name`
    );
    return NextResponse.json({ topics });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

/** POST — create a topic. trg_topics_before_insert derives the slug. */
export async function POST(request) {
  try {
    await requireAdmin();
    const b = await request.json();
    const name = String(b.topic_name || '').trim();
    if (name.length < 3) return NextResponse.json({ error: 'Topic name is too short.' }, { status: 400 });

    const result = await query(
      `INSERT INTO complexity_topics
        (topic_name, slug, category, difficulty, time_complexity, space_complexity, summary, notes_html, sort_order, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        String(b.slug || '').trim(),
        String(b.category || 'Fundamentals').slice(0, 60),
        ['Beginner', 'Intermediate', 'Advanced'].includes(b.difficulty) ? b.difficulty : 'Beginner',
        String(b.time_complexity || '').slice(0, 40) || null,
        String(b.space_complexity || '').slice(0, 40) || null,
        String(b.summary || '').slice(0, 300),
        String(b.notes_html || '<p>Notes coming soon.</p>'),
        Number(b.sort_order) || 100,
        b.is_published === false ? 0 : 1,
      ]
    );
    return NextResponse.json({ id: result.insertId, ok: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return NextResponse.json({ error: 'A topic with this slug already exists.' }, { status: 409 });
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
