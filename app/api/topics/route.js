import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/topics — published Learn topics with their code examples.
 * Uses the v_topic_overview view + a grouped CASE difficulty ordering.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const term = (searchParams.get('q') || '').trim();

  const topics = await query(
    `SELECT t.id, t.topic_name, t.slug, t.category, t.difficulty, t.time_complexity,
            t.space_complexity, t.summary, t.sort_order, t.updated_at,
            v.example_count, v.saved_count
       FROM v_topic_overview v
       JOIN complexity_topics t ON t.id = v.id
      WHERE t.is_published = 1
        ${term ? 'AND (t.topic_name LIKE ? OR t.summary LIKE ? OR t.category LIKE ?)' : ''}
      ORDER BY
        CASE t.category
          WHEN 'Fundamentals' THEN 1
          WHEN 'Common Complexities' THEN 2
          WHEN 'Data Structures & Algorithms' THEN 3
          WHEN 'Techniques' THEN 4
          ELSE 5
        END,
        t.sort_order, t.topic_name`,
    term ? [`%${term}%`, `%${term}%`, `%${term}%`] : []
  );

  const ids = topics.map((t) => t.id);
  const examples = ids.length
    ? await query(
        `SELECT id, topic_id, title, language, code_text, analysis_html,
                time_complexity, space_complexity, sort_order
           FROM topic_examples
          WHERE topic_id IN (${ids.map(() => '?').join(',')})
          ORDER BY sort_order, id`,
        ids
      )
    : [];

  const byTopic = {};
  for (const ex of examples) {
    if (!byTopic[ex.topic_id]) byTopic[ex.topic_id] = [];
    byTopic[ex.topic_id].push(ex);
  }

  return NextResponse.json({
    topics: topics.map((t) => ({ ...t, examples: byTopic[t.id] || [] })),
  });
}
