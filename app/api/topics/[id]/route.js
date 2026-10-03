import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/** GET /api/topics/[id] — one topic with examples (id or slug). */
export async function GET(request, { params }) {
  const resolvedParams = await params;
  const key = resolvedParams.id;
  const rows = await query(
    `SELECT * FROM v_topic_overview WHERE (id = ? OR slug = ?) AND is_published = 1 LIMIT 1`,
    [Number(key) || 0, key]
  );
  if (!rows.length) return NextResponse.json({ error: 'Topic not found.' }, { status: 404 });

  const examples = await query(
    `SELECT * FROM topic_examples WHERE topic_id = ? ORDER BY sort_order, id`,
    [rows[0].id]
  );
  return NextResponse.json({ topic: { ...rows[0], examples } });
}
