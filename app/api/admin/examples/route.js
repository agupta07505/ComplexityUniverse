import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

/** POST — add a code example to a topic. */
export async function POST(request) {
  try {
    await requireAdmin();
    const b = await request.json();
    const topicId = Number(b.topic_id);
    if (!topicId) return NextResponse.json({ error: 'Missing topic id.' }, { status: 400 });

    const result = await query(
      `INSERT INTO topic_examples
        (topic_id, title, language, code_text, analysis_html, time_complexity, space_complexity, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        topicId,
        String(b.title || 'Untitled example').slice(0, 140),
        String(b.language || 'javascript').slice(0, 30),
        String(b.code_text || ''),
        String(b.analysis_html || ''),
        String(b.time_complexity || '').slice(0, 40) || null,
        String(b.space_complexity || '').slice(0, 40) || null,
        Number(b.sort_order) || 10,
      ]
    );
    return NextResponse.json({ id: result.insertId, ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
