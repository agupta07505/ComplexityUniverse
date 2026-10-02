import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

/**
 * GET /api/admin/settings — site settings (Gemini key + model).
 * Reads from the app_settings table.
 */
export async function GET() {
  try {
    await requireAdmin();
    const rows = await query(`SELECT setting_key, setting_value, updated_at FROM app_settings`);
    const settings = {};
    for (const r of rows) settings[r.setting_key] = r.setting_value;
    return NextResponse.json({
      settings: {
        gemini_api_key: settings.gemini_api_key || '',
        gemini_model: settings.gemini_model || 'gemini-3.5-flash',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

/** PUT /api/admin/settings — save the Gemini API key / model.
 *  Uses INSERT ... ON DUPLICATE KEY UPDATE on the settings table. */
export async function PUT(request) {
  try {
    await requireAdmin();
    const b = await request.json();

    const apiKey = String(b.gemini_api_key ?? '').trim();
    let model = String(b.gemini_model ?? '').trim();
    if (!model) model = 'gemini-3.5-flash';
    if (!/^[a-zA-Z0-9._-]+$/.test(model)) {
      return NextResponse.json({ error: 'Model name contains invalid characters.' }, { status: 400 });
    }

    await query(
      `INSERT INTO app_settings (setting_key, setting_value) VALUES ('gemini_api_key', ?), ('gemini_model', ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [apiKey, model]
    );

    return NextResponse.json({
      ok: true,
      settings: { gemini_api_key: apiKey, gemini_model: model },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
