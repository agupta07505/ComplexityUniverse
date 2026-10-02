import { NextResponse } from 'next/server';
import { analyzeCode, getActivePrompt, promptMeta } from '@/lib/ai';

export const maxDuration = 60;

export async function POST(request) {
  try {
    const body = await request.json();
    const code = String(body.code || '');
    const language = String(body.language || 'auto');
    const mode = body.mode === 'short' ? 'short' : 'detailed';

    if (code.trim().length < 5) {
      return NextResponse.json({ error: 'Paste some code first — even a small function works.' }, { status: 400 });
    }
    if (code.length > 60000) {
      return NextResponse.json({ error: 'Code is too large for one analysis (60 KB max).' }, { status: 400 });
    }

    const promptRow = await getActivePrompt().catch(() => null);
    const result = await analyzeCode({ code, language, mode });

    return NextResponse.json({
      result: {
        ...result,
        language,
        mode,
        code,
      },
      prompt: promptMeta(promptRow),
    });
  } catch (err) {
    console.error('analyze error:', err);
    return NextResponse.json(
      { error: err.message || 'Analysis failed. Please try again.', code: err.code || undefined },
      { status: err.status || 500 }
    );
  }
}
