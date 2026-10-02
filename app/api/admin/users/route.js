import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

/** GET — all users from the overview view. */
export async function GET() {
  try {
    await requireAdmin();
    const users = await query(
      `SELECT id, name, email, role, status, analysis_count, saved_topic_count,
              rank_label, created_at, last_login_at
         FROM v_user_overview
        ORDER BY created_at DESC`
    );
    return NextResponse.json({ users });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
