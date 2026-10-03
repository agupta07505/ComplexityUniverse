import { query } from '@/lib/db';
import LearnView from '@/components/LearnView';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Learn — ComplexityUniverse',
  description: 'Complexity classes, algorithms and techniques with worked code and analysis.',
};

async function loadTopics() {
  const topics = await query(
    `SELECT t.id, t.topic_name, t.slug, t.category, t.difficulty, t.time_complexity,
            t.space_complexity, t.summary, t.notes_html, t.sort_order,
            v.example_count, v.saved_count
       FROM complexity_topics t
       LEFT JOIN v_topic_overview v ON v.id = t.id
      WHERE t.is_published = 1
      ORDER BY
        CASE t.category
          WHEN 'Fundamentals' THEN 1
          WHEN 'Common Complexities' THEN 2
          WHEN 'Data Structures & Algorithms' THEN 3
          WHEN 'Techniques' THEN 4
          ELSE 5
        END,
        t.sort_order, t.topic_name`
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

  return topics.map((t) => ({ ...t, examples: byTopic[t.id] || [] }));
}

export default async function LearnPage() {
  const topics = await loadTopics();
  return <LearnView topics={topics} />;
}
