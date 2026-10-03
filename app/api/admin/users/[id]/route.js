import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

/** PATCH — change role / status (CASE keeps the enum valid). */
export async function PATCH(request, { params }) {
  try {
    const admin = await requireAdmin();
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    const b = await request.json();
    if (id === admin.id) return NextResponse.json({ error: 'You cannot modify your own account here.' }, { status: 400 });

    await query(
      `UPDATE users
          SET role   = CASE WHEN ? IN ('user','admin') THEN ? ELSE role END,
              status = CASE WHEN ? IN ('active','suspended') THEN ? ELSE status END
        WHERE id = ?`,
      [b.role || '', b.role || '', b.status || '', b.status || '', id]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

/** DELETE — user rows cascade to profiles, analyses, bookmarks, activity. */
export async function DELETE(request, { params }) {
  try {
    const admin = await requireAdmin();
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    if (id === admin.id) return NextResponse.json({ error: 'You cannot delete your own account here.' }, { status: 400 });
    await query(`DELETE FROM users WHERE id = ?`, [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
