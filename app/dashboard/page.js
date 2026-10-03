import { redirect } from 'next/navigation';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import DashboardView from '@/components/DashboardView';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dashboard — ComplexityUniverse',
};

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  // identity card + counters come from the MySQL view
  const profileRows = await query(`SELECT * FROM v_user_overview WHERE id = ? LIMIT 1`, [user.id]);
  // dashboard counters — one SELECT with sub-queries (keeps the SQL simple)
  const statsRows = await query(
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
  const stats = statsRows[0] || {};

  const analyses = await query(
    `SELECT v.id, v.title, v.language, v.time_complexity, v.space_complexity, v.summary,
            v.code_lines, v.detail_mode, v.engine, v.cost_grade, v.created_at,
            a.detailed_analysis
       FROM v_analysis_feed v
       JOIN code_analyses a ON a.id = v.id
      WHERE v.user_id = ?
      ORDER BY v.created_at DESC, v.id DESC
      LIMIT 100`,
    [user.id]
  );

  const savedTopics = await query(
    `SELECT bookmark_id, topic_id, topic_name, slug, category, difficulty,
            time_complexity, space_complexity, summary, note, saved_at
       FROM v_user_saved_topics
      WHERE user_id = ?
      ORDER BY saved_at DESC`,
    [user.id]
  );

  const activity = await query(
    `SELECT action, entity, detail, created_at
       FROM activity_log
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT 8`,
    [user.id]
  );

  return (
    <DashboardView
      profile={profileRows[0] || { ...user, saved_topic_count: 0, rank_label: 'Newcomer' }}
      stats={stats}
      analyses={analyses}
      savedTopics={savedTopics}
      activity={activity}
    />
  );
}
