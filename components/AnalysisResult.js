'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ComplexityBadge, { gradeFor } from './ComplexityBadge';
import CodeBlock from './CodeBlock';

export default function AnalysisResult({ result, promptInfo, onSave, saved }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const conf = Math.round((Number(result.confidence) || 0.7) * 100);
  const grade = gradeFor(result.time_complexity);

  async function handleSave() {
    setSaving(true);
    setSaveError('');
    try {
      await onSave();
    } catch (err) {
      if (err.message === 'Save failed' || err.message?.includes('Sign in')) {
        setSaveError('Sign in to save this analysis to your dashboard.');
      } else {
        setSaveError(err.message || 'Could not save.');
      }
    } finally {
      setSaving(false);
    }
  }

  const orbColorClass =
    grade === 'green'
      ? 'cu-orb-green'
      : grade === 'blue'
      ? 'cu-orb-blue'
      : grade === 'amber'
      ? 'cu-orb-amber'
      : grade === 'red'
      ? 'cu-orb-red'
      : 'cu-orb-plain';

  return (
    <div className="cu-result">
      {/* headline card */}
      <div className="cu-result-head">
        <div className="cu-result-headline">
          <div className="cu-chip-row" style={{ alignItems: 'center' }}>
            <ComplexityBadge label="Time" value={result.time_complexity} />
            <ComplexityBadge label="Space" value={result.space_complexity} />
            <span className="cu-badge cu-badge-plain" title="Analysis confidence">
              {conf}% confidence
            </span>
            <span className="cu-badge cu-badge-plain" title="Which engine produced this">
              {result.engine === 'gemini' ? 'Gemini AI' : 'AI engine'}
            </span>
            {promptInfo?.version ? (
              <span className="cu-badge cu-badge-plain" title="Active admin prompt version">
                prompt v{promptInfo.version}
              </span>
            ) : null}
          </div>
          <p className="cu-result-summary">{result.summary}</p>
        </div>

        <div className="cu-result-headside">
          <div className={`cu-result-orb ${orbColorClass}`}>
            <span className="cu-result-orb-label">cost</span>
            <span className="cu-result-orb-value mono">{result.time_complexity}</span>
          </div>
          {onSave && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {saved ? (
                <span className="cu-success-text">✓ Saved to dashboard</span>
              ) : (
                <button
                  type="button"
                  className="cu-btn cu-btn-primary cu-btn-sm"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save to dashboard'}
                </button>
              )}
              {saveError && (
                <>
                  <span className="cu-error-text">{saveError}</span>
                  <button
                    type="button"
                    className="cu-btn cu-btn-ghost cu-btn-sm"
                    onClick={() => router.push('/login')}
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* cases table */}
      <div className="cu-result-grid">
        <section className="cu-card cu-card-pad">
          <h3 className="cu-result-h3">Complexity by case</h3>
          <table className="cu-table">
            <tbody>
              <tr>
                <td style={{ fontWeight: 620, width: '33%' }}>Best</td>
                <td className="mono">{result.cases?.best || result.time_complexity}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 620 }}>Average</td>
                <td className="mono">{result.cases?.average || result.time_complexity}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 620 }}>Worst</td>
                <td className="mono">{result.cases?.worst || result.time_complexity}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="cu-card cu-card-pad">
          <h3 className="cu-result-h3">Where the cost comes from</h3>
          <ul className="cu-cost-list">
            {(result.breakdown || []).map((b, i) => (
              <li key={i}>
                <div className="cu-cost-row">
                  <strong>{b.label}</strong>
                  {b.cost && <span className="mono cu-cost-tag">{b.cost}</span>}
                </div>
                <span>{b.detail}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* approach */}
      {result.approach && (
        <section className="cu-card cu-card-pad">
          <h3 className="cu-result-h3">How this was measured</h3>
          <p style={{ color: 'var(--ink-2)' }}>{result.approach}</p>
        </section>
      )}

      {/* bottlenecks + optimizations */}
      <div className="cu-result-grid">
        <section className="cu-card cu-card-pad">
          <h3 className="cu-result-h3">Bottlenecks</h3>
          <ul className="cu-bullet-warn">
            {(result.bottlenecks || []).map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </section>
        <section className="cu-card cu-card-pad">
          <h3 className="cu-result-h3">Optimization ideas</h3>
          <ul className="cu-bullet-good">
            {(result.optimizations || []).map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </section>
      </div>

      {/* code echo */}
      {result.code && (
        <section>
          <h3 className="cu-result-h3" style={{ marginLeft: 2 }}>
            Analyzed code
          </h3>
          <CodeBlock code={result.code} language={result.language || 'code'} />
        </section>
      )}

      {result.notes && <p className="cu-hint cu-result-notes">{result.notes}</p>}
    </div>
  );
}
