'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ComplexityBadge, { gradeFor } from './ComplexityBadge';
import CodeBlock from './CodeBlock';
import styles from '@/app/page.module.css';

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
      ? styles.orbGreen
      : grade === 'blue'
      ? styles.orbBlue
      : grade === 'amber'
      ? styles.orbAmber
      : grade === 'red'
      ? styles.orbRed
      : styles.orbPlain;

  return (
    <div className={styles.result}>
      {/* headline card */}
      <div className={styles.resultHead}>
        <div className={styles.resultHeadline}>
          <div className="cu-chip-row" style={{ alignItems: 'center' }}>
            <ComplexityBadge label="Time" value={result.time_complexity} />
            <ComplexityBadge label="Space" value={result.space_complexity} />
            <span className={`cu-badge cu-badge-plain`} title="Analysis confidence">
              {conf}% confidence
            </span>
            <span className={`cu-badge cu-badge-plain`} title="Which engine produced this">
              {result.engine === 'gemini' ? 'Gemini AI' : 'AI engine'}
            </span>
            {promptInfo?.version ? (
              <span className="cu-badge cu-badge-plain" title="Active admin prompt version">
                prompt v{promptInfo.version}
              </span>
            ) : null}
          </div>
          <p className={styles.resultSummary}>{result.summary}</p>
        </div>

        <div className={styles.resultHeadside}>
          <div className={`${styles.resultOrb} ${orbColorClass}`}>
            <span className={styles.resultOrbLabel}>cost</span>
            <span className={`${styles.resultOrbValue} mono`}>{result.time_complexity}</span>
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
      <div className={styles.resultGrid}>
        <section className="cu-card cu-card-pad">
          <h3 className={styles.resultH3}>Complexity by case</h3>
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
          <h3 className={styles.resultH3}>Where the cost comes from</h3>
          <ul className={styles.costList}>
            {(result.breakdown || []).map((b, i) => (
              <li key={i}>
                <div className={styles.costRow}>
                  <strong>{b.label}</strong>
                  {b.cost && <span className={`mono ${styles.costTag}`}>{b.cost}</span>}
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
          <h3 className={styles.resultH3}>How this was measured</h3>
          <p style={{ color: 'var(--ink-2)' }}>{result.approach}</p>
        </section>
      )}

      {/* bottlenecks + optimizations */}
      <div className={styles.resultGrid}>
        <section className="cu-card cu-card-pad">
          <h3 className={styles.resultH3}>Bottlenecks</h3>
          <ul className={styles.bulletWarn}>
            {(result.bottlenecks || []).map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </section>
        <section className="cu-card cu-card-pad">
          <h3 className={styles.resultH3}>Optimization ideas</h3>
          <ul className={styles.bulletGood}>
            {(result.optimizations || []).map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </section>
      </div>

      {/* code echo */}
      {result.code && (
        <section>
          <h3 className={styles.resultH3} style={{ marginLeft: 2 }}>
            Analyzed code
          </h3>
          <CodeBlock code={result.code} language={result.language || 'code'} />
        </section>
      )}

      {result.notes && <p className={`cu-hint ${styles.resultNotes}`}>{result.notes}</p>}
    </div>
  );
}
