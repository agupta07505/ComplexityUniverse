import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    await requireAdmin();
    const resolvedParams = await params;
    const b = await request.json();
    await query(
      `UPDATE topic_examples
          SET title = ?, language = ?, code_text = ?, analysis_html = ?,
              time_complexity = ?, space_complexity = ?, sort_order = ?
        WHERE id = ?`,
      [
        String(b.title || '').slice(0, 140),
        String(b.language || 'javascript').slice(0, 30),
        String(b.code_text || ''),
        String(b.analysis_html || ''),
        String(b.time_complexity || '').slice(0, 40) || null,
        String(b.space_complexity || '').slice(0, 40) || null,
        Number(b.sort_order) || 10,
        Number(resolvedParams.id),
      ]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin();
    const resolvedParams = await params;
    await query(`DELETE FROM topic_examples WHERE id = ?`, [Number(resolvedParams.id)]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
