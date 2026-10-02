import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

/** GET — admin home stats (views + GROUP BY). */
export async function GET() {
  try {
    await requireAdmin();
    const [totals] = await query(
      `SELECT (SELECT COUNT(*) FROM users)                              AS users,
              (SELECT COUNT(*) FROM code_analyses)                      AS analyses,
              (SELECT COUNT(*) FROM complexity_topics)                  AS topics,
              (SELECT COUNT(*) FROM topic_examples)                     AS examples,
              (SELECT COUNT(*) FROM user_saved_topics)                  AS bookmarks,
              (SELECT COUNT(*) FROM activity_log)                       AS log_entries`
    );
    const distribution = await query(`SELECT * FROM v_complexity_distribution LIMIT 8`);
    const recent = await query(
      `SELECT action, entity, detail, created_at FROM activity_log ORDER BY id DESC LIMIT 12`
    );
    return NextResponse.json({ totals, distribution, recent });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
