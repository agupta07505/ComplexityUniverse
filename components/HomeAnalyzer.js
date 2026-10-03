'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StarField from './StarField';
import AnalysisResult from './AnalysisResult';

const SUPPORTED_LANGUAGES = [
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

const SAMPLE_NAMES = {
  binary: 'Binary search',
  nested: 'Nested loops',
  recursion: 'Naive Fibonacci',
  sort: 'Sort a list',
};

export default function HomeAnalyzer({ samples }) {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('auto');
  const [mode, setMode] = useState('detailed');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [promptInfo, setPromptInfo] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const resultsRef = useRef(null);

  async function handleAnalyze() {
    if (!code.trim()) {
      setErrorMessage('Paste some code first — even a small function works.');
      return;
    }
    setIsAnalyzing(true);
    setErrorMessage('');
    setIsSaved(false);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, mode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Analysis failed');
      setAnalysisResult(data.result);
      setPromptInfo(data.prompt);
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } catch (error) {
      setErrorMessage(error.message || 'Something went wrong. Try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleKeyDown(event) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      handleAnalyze();
    }
  }

  return (
    <div>
      {/* ---------------- Hero Section ---------------- */}
      <section className="hero-banner">
        <StarField className="hero-stars-overlay" />
        <div className="cu-wrap hero-content">
          <span className="cu-eyebrow">Time &amp; space complexity, decoded</span>
          <h1 className="cu-display hero-title">
            Understand what your code
            <br />
            actually <em>costs</em>.
          </h1>
          <p className="hero-subtitle">
            Paste any function or algorithm. ComplexityUniverse measures how it grows —
            with a line-by-line breakdown, bottlenecks and concrete optimizations, saved to
            your personal dashboard.
          </p>
        </div>
      </section>

      {/* ---------------- Code Analyzer ---------------- */}
      <section className="cu-wrap analyzer-section">
        <div className="cu-card analyzer-card">
          <div className="analyzer-toolbar">
            <label className="toolbar-group">
              <span>Language</span>
              <select
                className="cu-input language-selector"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {SUPPORTED_LANGUAGES.map(([langValue, langLabel]) => (
                  <option key={langValue} value={langValue}>
                    {langLabel}
                  </option>
                ))}
              </select>
            </label>

            <div className="toolbar-group">
              <span>Detail</span>
              <div className="mode-toggle-group">
                <button
                  type="button"
                  className={mode === 'detailed' ? 'is-active' : ''}
                  onClick={() => setMode('detailed')}
                >
                  Detailed
                </button>
                <button
                  type="button"
                  className={mode === 'short' ? 'is-active' : ''}
                  onClick={() => setMode('short')}
                >
                  Short
                </button>
              </div>
            </div>

            <div className="sample-buttons-group">
              <span>Try</span>
              {Object.keys(samples).map((sampleKey) => (
                <button
                  key={sampleKey}
                  type="button"
                  className="sample-btn"
                  onClick={() => {
                    setCode(samples[sampleKey]);
                    setErrorMessage('');
                  }}
                >
                  {SAMPLE_NAMES[sampleKey]}
                </button>
              ))}
            </div>
          </div>

          <div className="code-editor-box">
            <textarea
              className="code-textarea"
              spellCheck={false}
              autoComplete="off"
              placeholder={'// Paste your code here\nfunction sum(arr) {\n  // ...\n}'}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Action Row */}
          <div className="analyzer-action-bar">
            <button
              type="button"
              className="cu-btn cu-btn-accent cu-btn-lg"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
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
            {errorMessage && <span className="cu-error-text">{errorMessage}</span>}
          </div>
        </div>

        {/* ---------------- Results Section ---------------- */}
        <div ref={resultsRef} className="results-container">
          <AnimatePresence mode="wait">
            {analysisResult && (
              <motion.div
                key={`${analysisResult.time_complexity}-${analysisResult.space_complexity}-${Date.now()}`}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
              >
                <AnalysisResult
                  result={analysisResult}
                  promptInfo={promptInfo}
                  saved={isSaved}
                  onSave={async () => {
                    const response = await fetch('/api/analyses', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        code,
                        language: analysisResult.language || language,
                        mode,
                        title: `Analysis — ${(analysisResult.time_complexity || 'code').toString()}`,
                        ...analysisResult,
                        detailed_analysis: {
                          summary: analysisResult.summary,
                          approach: analysisResult.approach,
                          breakdown: analysisResult.breakdown,
                          cases: analysisResult.cases,
                          bottlenecks: analysisResult.bottlenecks,
                          optimizations: analysisResult.optimizations,
                          notes: analysisResult.notes,
                          confidence: analysisResult.confidence,
                          time_complexity: analysisResult.time_complexity,
                          space_complexity: analysisResult.space_complexity,
                        },
                      }),
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.error || 'Save failed');
                    setIsSaved(true);
                  }}
                />
              </motion.div>
            )}

            {!analysisResult && (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="placeholder-card"
              >
                <div className="placeholder-row">
                  <span className="placeholder-pill" />
                  <span className="placeholder-line" style={{ width: '38%' }} />
                </div>
                <div className="placeholder-line" style={{ width: '92%' }} />
                <div className="placeholder-line" style={{ width: '84%' }} />
                <div className="placeholder-line" style={{ width: '60%' }} />
                <p>
                  Your detailed analysis will appear here — complexity classes, case table,
                  bottlenecks and optimizations.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ---------------- Feature Highlights ---------------- */}
      <section className="cu-wrap home-features-section">
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
