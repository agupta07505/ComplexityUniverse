import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

/** GET — current AI prompt (for the admin editor). */
export async function GET() {
  try {
    await requireAdmin();
    const rows = await query(
      `SELECT p.id, p.name, p.prompt_template, p.is_active, p.version, p.updated_at,
              u.name AS updated_by_name
         FROM analysis_prompts p
         LEFT JOIN users u ON u.id = p.updated_by
        ORDER BY p.id DESC LIMIT 5`
    );
    return NextResponse.json({ prompts: rows, active: rows.find((r) => Number(r.is_active) === 1) || rows[0] || null });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

/** PUT — save the prompt. trg_prompt_before_update bumps `version`. */
export async function PUT(request) {
  try {
    const admin = await requireAdmin();
    const b = await request.json();
    const template = String(b.prompt_template || '');
    const name = String(b.name || 'default-complexity-analyst').slice(0, 80);

    if (template.trim().length < 40) {
      return NextResponse.json({ error: 'The prompt is too short to be useful.' }, { status: 400 });
    }
    if (!template.includes('{CODE}')) {
      return NextResponse.json({ error: 'The prompt must contain the {CODE} placeholder.' }, { status: 400 });
    }

    const rows = await query(`SELECT id FROM analysis_prompts WHERE is_active = 1 ORDER BY id LIMIT 1`);
    if (rows.length) {
      await query(
        `UPDATE analysis_prompts SET prompt_template = ?, name = ?, updated_by = ? WHERE id = ?`,
        [template, name, admin.id, rows[0].id]
      );
    } else {
      await query(
        `INSERT INTO analysis_prompts (name, prompt_template, is_active, updated_by) VALUES (?, ?, 1, ?)`,
        [name, template, admin.id]
      );
    }

    const after = await query(`SELECT id, name, version, updated_at FROM analysis_prompts WHERE is_active = 1 LIMIT 1`);
    return NextResponse.json({ ok: true, prompt: after[0] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
