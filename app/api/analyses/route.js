import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

/** GET /api/analyses — current user's saved analyses (reads v_analysis_feed + code_analyses). */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in to see your analyses.' }, { status: 401 });

  const rows = await query(
    `SELECT v.id, v.title, v.language, v.time_complexity, v.space_complexity, v.summary,
            v.code_lines, v.detail_mode, v.engine, v.cost_grade, v.created_at,
            a.code_text, a.detailed_analysis
       FROM v_analysis_feed v
       JOIN code_analyses a ON a.id = v.id
      WHERE v.user_id = ?
      ORDER BY v.created_at DESC, v.id DESC
      LIMIT 100`,
    [user.id]
  );
  return NextResponse.json({ analyses: rows });
}

/** POST /api/analyses — save the current analysis to the dashboard. */
export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in to save analyses.' }, { status: 401 });

  try {
    const b = await request.json();
    const code = String(b.code || '');
    const detailed = b.detailed_analysis ?? b.result ?? {};
    if (!detailed.code && code) detailed.code = code;
    if (!detailed.cases && b.cases) detailed.cases = b.cases;
    if (!detailed.breakdown && b.breakdown) detailed.breakdown = b.breakdown;
    if (!detailed.approach && b.approach) detailed.approach = b.approach;
    if (!detailed.bottlenecks && b.bottlenecks) detailed.bottlenecks = b.bottlenecks;
    if (!detailed.optimizations && b.optimizations) detailed.optimizations = b.optimizations;
    if (!detailed.notes && b.notes) detailed.notes = b.notes;
    if (!detailed.time_complexity && b.time_complexity) detailed.time_complexity = b.time_complexity;
    if (!detailed.space_complexity && b.space_complexity) detailed.space_complexity = b.space_complexity;

    const title = String(b.title || 'Untitled analysis').slice(0, 140);
    const language = String(b.language || 'javascript').slice(0, 30);
    const timeComplexity = String(b.time_complexity || detailed.time_complexity || 'O(n)').slice(0, 40);
    const spaceComplexity = String(b.space_complexity || detailed.space_complexity || 'O(1)').slice(0, 40);
    const summary = String(b.summary || detailed.summary || '').slice(0, 2000);
    const mode = b.mode === 'short' ? 'short' : 'detailed';
    const engine = String(b.engine || 'gemini').slice(0, 20);

    if (!code.trim()) return NextResponse.json({ error: 'Nothing to save — code is empty.' }, { status: 400 });

    // trg_analyses_after_insert bumps users.analysis_count and writes activity_log
    const result = await query(
      `INSERT INTO code_analyses
        (user_id, title, language, code_text, time_complexity, space_complexity,
         summary, detailed_analysis, detail_mode, engine, prompt_version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        title,
        language,
        code,
        timeComplexity,
        spaceComplexity,
        summary,
        JSON.stringify(detailed),
        mode,
        engine,
        b.prompt_version ?? null,
      ]
    );

    return NextResponse.json({ id: result.insertId, ok: true });
  } catch (err) {
    console.error('save analysis error:', err);
    return NextResponse.json({ error: 'Could not save this analysis.' }, { status: 500 });
  }
}
