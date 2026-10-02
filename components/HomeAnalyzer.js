'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StarField from './StarField';
import AnalysisResult from './AnalysisResult';

const LANGUAGES = [
  ['auto', 'Auto-detect'],
  ['javascript', 'JavaScript'],
  ['typescript', 'TypeScript'],
  ['python', 'Python'],
  ['java', 'Java'],
  ['cpp', 'C / C++'],
  ['go', 'Go'],
  ['rust', 'Rust'],
  ['php', 'PHP'],
];

const SAMPLE_LABELS = {
  binary: 'Binary search',
  nested: 'Nested loops',
  recursion: 'Naive Fibonacci',
  sort: 'Sort a list',
};

export default function HomeAnalyzer({ samples }) {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('auto');
  const [mode, setMode] = useState('detailed');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [promptInfo, setPromptInfo] = useState(null);
  const [saved, setSaved] = useState(false);
  const resultRef = useRef(null);

  async function analyze() {
    if (!code.trim()) {
      setError('Paste some code first — even a small function works.');
      return;
    }
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data.result);
      setPromptInfo(data.prompt);
      requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      analyze();
    }
  }

  return (
    <div className="cu-home">
      {/* ---------------- hero ---------------- */}
      <section className="cu-hero">
        <StarField className="cu-hero-stars" />
        <div className="cu-wrap cu-hero-in">
          <span className="cu-eyebrow">Time &amp; space complexity, decoded</span>
          <h1 className="cu-display cu-hero-title">
            Understand what your code
            <br />
            actually <em>costs</em>.
          </h1>
          <p className="cu-hero-sub">
            Paste any function or algorithm. ComplexityUniverse measures how it grows —
            with a line-by-line breakdown, bottlenecks and concrete optimizations, saved to
            your personal dashboard.
          </p>

          <div className="cu-chip-row cu-hero-chips">
            <span className="cu-badge cu-badge-green mono">O(1)</span>
            <span className="cu-badge cu-badge-green mono">O(log n)</span>
            <span className="cu-badge cu-badge-blue mono">O(n)</span>
            <span className="cu-badge cu-badge-blue mono">O(n log n)</span>
            <span className="cu-badge cu-badge-amber mono">O(n²)</span>
            <span className="cu-badge cu-badge-amber mono">O(n³)</span>
            <span className="cu-badge cu-badge-red mono">O(2ⁿ)</span>
          </div>
        </div>
      </section>

      {/* ---------------- analyzer ---------------- */}
      <section className="cu-wrap cu-analyzer">
        <div className="cu-card cu-analyzer-card">
          <div className="cu-analyzer-toolbar">
            <label className="cu-analyzer-tool">
              <span>Language</span>
              <select
                className="cu-select cu-select-sm"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {LANGUAGES.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>

            <div className="cu-analyzer-tool">
              <span>Detail</span>
              <div className="cu-seg">
                <button
                  type="button"
                  className={mode === 'detailed' ? 'is-on' : ''}
                  onClick={() => setMode('detailed')}
                >
                  Detailed
                </button>
                <button
                  type="button"
                  className={mode === 'short' ? 'is-on' : ''}
                  onClick={() => setMode('short')}
                >
                  Short
                </button>
              </div>
            </div>

            <div className="cu-analyzer-samples">
              <span>Try</span>
              {Object.keys(samples).map((k) => (
                <button
                  key={k}
                  type="button"
                  className="cu-linkish"
                  onClick={() => {
                    setCode(samples[k]);
                    setError('');
                  }}
                >
                  {SAMPLE_LABELS[k]}
                </button>
              ))}
            </div>
          </div>

          <div className="cu-editor">
            <textarea
              className="cu-editor-area"
              spellCheck={false}
              autoComplete="off"
              placeholder={'// Paste your code here\nfunction sum(arr) {\n  // ...\n}'}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={onKeyDown}
            />
          </div>

          {/* Analyze button sits right below the textarea */}
          <div className="cu-analyzer-actions">
            <button
              type="button"
              className="cu-btn cu-btn-accent cu-btn-lg"
              onClick={analyze}
              disabled={busy}
            >
              {busy ? (
                <>
                  <span className="cu-spin" /> Analyzing
                </>
              ) : (
                'Analyze complexity'
              )}
            </button>
            <span className="cu-hint">
              {code.trim() ? `${code.split('\n').length} lines ready` : 'Ctrl + Enter to analyze'}
            </span>
            {error && <span className="cu-error-text">{error}</span>}
          </div>
        </div>

        {/* ---------------- results ---------------- */}
        <div ref={resultRef} className="cu-results-zone">
          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                key={`${result.time_complexity}-${result.space_complexity}-${Date.now()}`}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
              >
                <AnalysisResult
                  result={result}
                  promptInfo={promptInfo}
                  saved={saved}
                  onSave={async () => {
                    const res = await fetch('/api/analyses', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        code,
                        language: result.language || language,
                        mode,
                        title: `Analysis — ${(result.time_complexity || 'code').toString()}`,
                        ...result,
                        detailed_analysis: {
                          summary: result.summary,
                          approach: result.approach,
                          breakdown: result.breakdown,
                          cases: result.cases,
                          bottlenecks: result.bottlenecks,
                          optimizations: result.optimizations,
                          notes: result.notes,
                          confidence: result.confidence,
                          time_complexity: result.time_complexity,
                          space_complexity: result.space_complexity,
                        },
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Save failed');
                    setSaved(true);
                  }}
                />
              </motion.div>
            )}

            {!result && (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="cu-results-placeholder"
              >
                <div className="cu-ph-row">
                  <span className="cu-ph-pill" />
                  <span className="cu-ph-line" style={{ width: '38%' }} />
                </div>
                <div className="cu-ph-line" style={{ width: '92%' }} />
                <div className="cu-ph-line" style={{ width: '84%' }} />
                <div className="cu-ph-line" style={{ width: '60%' }} />
                <p>
                  Your detailed analysis will appear here — complexity classes, case table,
                  bottlenecks and optimizations.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ---------------- how it helps ---------------- */}
      <section className="cu-wrap cu-home-below">
        <div className="cu-grid-3">
          <div className="cu-card cu-card-pad">
            <h3>Cost, not vibes</h3>
            <p>
              Every result states time and space complexity with the reasoning attached — the
              loop nesting, the recursion shape, the structures you allocated.
            </p>
          </div>
          <div className="cu-card cu-card-pad">
            <h3>Learn as you check</h3>
            <p>
              Cross-reference any result with the Learn library: complexity classes, sorting,
              searching, graphs and techniques — with worked code and notes.
            </p>
          </div>
          <div className="cu-card cu-card-pad">
            <h3>Keep a history</h3>
            <p>
              Sign in to save analyses to your dashboard, bookmark the topics that matter and
              track how your code has been costing you over time.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
