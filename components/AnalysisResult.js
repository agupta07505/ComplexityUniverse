'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ComplexityBadge, { gradeFor } from './ComplexityBadge';
import CodeBlock from './CodeBlock';

export default function AnalysisResult({ result, promptInfo, onSave, saved }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const confidencePercent = Math.round((Number(result.confidence) || 0.7) * 100);
  const grade = gradeFor(result.time_complexity);

  async function handleSaveAnalysis() {
    setSaving(true);
    setSaveError('');
    try {
      await onSave();
    } catch (error) {
      if (error.message === 'Save failed' || error.message?.includes('Sign in')) {
        setSaveError('Sign in to save this analysis to your dashboard.');
      } else {
        setSaveError(error.message || 'Could not save analysis.');
      }
    } finally {
      setSaving(false);
    }
  }

  const orbColorClass =
    grade === 'green'
      ? 'orb-green'
      : grade === 'blue'
      ? 'orb-blue'
      : grade === 'amber'
      ? 'orb-amber'
      : grade === 'red'
      ? 'orb-red'
      : 'orb-plain';

  return (
    <div className="analysis-result">
      {/* Overview Card */}
      <div className="result-header">
        <div className="result-headline">
          <div className="cu-chip-row" style={{ alignItems: 'center' }}>
            <ComplexityBadge label="Time" value={result.time_complexity} />
            <ComplexityBadge label="Space" value={result.space_complexity} />
            <span className="cu-badge cu-badge-plain" title="Analysis confidence">
              {confidencePercent}% confidence
            </span>
            <span className="cu-badge cu-badge-plain" title="Analyzed exclusively via Google Gemini API">
              Gemini AI ({result.model || 'Flash'})
            </span>
            {promptInfo?.version ? (
              <span className="cu-badge cu-badge-plain" title="Active admin prompt version">
                prompt v{promptInfo.version}
              </span>
            ) : null}
          </div>
          <p className="result-summary">{result.summary}</p>
        </div>

        {/* Complexity Orb & Save Button */}
        <div className="result-actions-side">
          <div className={`complexity-orb ${orbColorClass}`}>
            <span className="orb-label">cost</span>
            <span className="orb-value mono">{result.time_complexity}</span>
          </div>
          {onSave && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {saved ? (
                <span className="cu-success-text">✓ Saved to dashboard</span>
              ) : (
                <button
                  type="button"
                  className="cu-btn cu-btn-primary cu-btn-sm"
                  onClick={handleSaveAnalysis}
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

      {/* Cases & Breakdown Grid */}
      <div className="result-grid">
        <section className="cu-card cu-card-pad">
          <h3 className="result-section-title">Complexity by case</h3>
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
          <h3 className="result-section-title">Where the cost comes from</h3>
          <ul className="cost-breakdown-list">
            {(result.breakdown || []).map((breakdownItem, index) => (
              <li key={index}>
                <div className="cost-item-header">
                  <strong>{breakdownItem.label}</strong>
                  {breakdownItem.cost && <span className="mono cost-badge">{breakdownItem.cost}</span>}
                </div>
                <span>{breakdownItem.detail}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Approach Explanation */}
      {result.approach && (
        <section className="cu-card cu-card-pad">
          <h3 className="result-section-title">How this was measured</h3>
          <p style={{ color: 'var(--ink-2)' }}>{result.approach}</p>
        </section>
      )}

      {/* Bottlenecks and Optimizations */}
      <div className="result-grid">
        <section className="cu-card cu-card-pad">
          <h3 className="result-section-title">Bottlenecks</h3>
          <ul className="warning-bullets">
            {(result.bottlenecks || []).map((bottleneck, index) => (
              <li key={index}>{bottleneck}</li>
            ))}
          </ul>
        </section>
        <section className="cu-card cu-card-pad">
          <h3 className="result-section-title">Optimization ideas</h3>
          <ul className="good-bullets">
            {(result.optimizations || []).map((optimization, index) => (
              <li key={index}>{optimization}</li>
            ))}
          </ul>
        </section>
      </div>

      {/* Echo of Code Analyzed */}
      {result.code && (
        <section>
          <h3 className="result-section-title" style={{ marginLeft: 2 }}>
            Analyzed code
          </h3>
          <CodeBlock code={result.code} language={result.language || 'code'} />
        </section>
      )}

      {result.notes && <p className="cu-hint result-notes">{result.notes}</p>}
    </div>
  );
}
