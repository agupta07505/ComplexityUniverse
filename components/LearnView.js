'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import ComplexityBadge from './ComplexityBadge';
import CodeBlock from './CodeBlock';
import styles from '@/app/learn/page.module.css';

function SaveTopicButton({ topicId }) {
  const [state, setState] = useState('idle'); // idle | saved | loading
  const [error, setError] = useState('');

  async function toggle() {
    setState('loading');
    setError('');
    try {
      const res = await fetch(`/api/topics/${topicId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save');
      setState(data.saved ? 'saved' : 'idle');
    } catch (err) {
      setError(err.message);
      setState('idle');
    }
  }

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
      <button
        type="button"
        className={`cu-btn cu-btn-sm ${state === 'saved' ? 'cu-btn-accent' : 'cu-btn-ghost'}`}
        onClick={toggle}
      >
        {state === 'saved' ? '★ Saved' : '☆ Save topic'}
      </button>
      {error && (
        <span className="cu-error-text" style={{ fontSize: 12 }}>
          {error === 'Sign in to save topics.' ? (
            <>
              <Link href="/login">Sign in</Link> to save
            </>
          ) : (
            error
          )}
        </span>
      )}
    </span>
  );
}

export default function LearnView({ topics }) {
  const [filter, setFilter] = useState('');
  const [active, setActive] = useState(topics[0]?.slug || '');
  const mainRef = useRef(null);

  const grouped = useMemo(() => {
    const f = filter.trim().toLowerCase();
    const list = topics.filter(
      (t) =>
        !f ||
        t.topic_name.toLowerCase().includes(f) ||
        t.summary.toLowerCase().includes(f) ||
        t.category.toLowerCase().includes(f)
    );
    const map = new Map();
    for (const t of list) {
      if (!map.has(t.category)) map.set(t.category, []);
      map.get(t.category).push(t);
    }
    return [...map.entries()];
  }, [topics, filter]);

  // scroll-spy: highlight the topic currently in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActive(e.target.id.replace('topic-', ''));
            break;
          }
        }
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: 0.01 }
    );
    document.querySelectorAll('.cu-topic-section').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [grouped]);

  return (
    <div className="cu-wrap cu-page cu-learn">
      <div className="cu-section-head">
        <span className="cu-eyebrow">Learn library</span>
        <h1 className="cu-display" style={{ fontSize: 'clamp(30px, 4vw, 42px)' }}>
          Complexity, topic by topic
        </h1>
        <p style={{ color: 'var(--ink-2)', fontSize: 16.5 }}>
          Notes, worked examples and analysis for every complexity class and classic algorithm
          pattern. Save the topics you want to revisit.
        </p>
      </div>

      <div className={styles.learnGrid}>
        {/* -------- left: topics -------- */}
        <aside className={styles.learnSide}>
          <input
            className={`cu-input ${styles.learnSearch}`}
            placeholder="Filter topics…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <nav className={styles.learnNav}>
            {grouped.map(([category, items]) => (
              <div key={category} className="cu-learn-group">
                <div className={styles.learnGroupTitle}>{category}</div>
                {items.map((t) => (
                  <a
                    key={t.id}
                    href={`#topic-${t.slug}`}
                    className={`${styles.learnLink} ${active === t.slug ? styles.isActive : ''}`}
                  >
                    <span>{t.topic_name}</span>
                    {t.time_complexity && <span className={`mono ${styles.learnLinkTag}`}>{t.time_complexity}</span>}
                  </a>
                ))}
              </div>
            ))}
            {!grouped.length && <p className="cu-hint">No topics match “{filter}”.</p>}
          </nav>
        </aside>

        {/* -------- right: notes -------- */}
        <div className="cu-learn-main" ref={mainRef}>
          {grouped.map(([category, items]) => (
            <section key={category} className={styles.learnCategory}>
              <h2 className={styles.learnCatTitle}>{category}</h2>

              {items.map((t) => (
                <article
                  key={t.id}
                  id={`topic-${t.slug}`}
                  className={`cu-card ${styles.topicSection}`}
                >
                  <header className={styles.topicHead}>
                    <div>
                      <h3 className={styles.topicTitle}>{t.topic_name}</h3>
                      <p className={styles.topicSummary}>{t.summary}</p>
                      <div className="cu-chip-row">
                        <span className="cu-badge cu-badge-plain">{t.difficulty}</span>
                        <ComplexityBadge label="Time" value={t.time_complexity} />
                        <ComplexityBadge label="Space" value={t.space_complexity} />
                        {t.example_count > 0 && (
                          <span className="cu-badge cu-badge-plain">
                            {t.example_count} example{t.example_count > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <SaveTopicButton topicId={t.id} />
                  </header>

                  <div className="cu-prose" dangerouslySetInnerHTML={{ __html: t.notes_html }} />

                  {(t.examples || []).map((ex) => (
                    <div key={ex.id} className={styles.topicExample}>
                      <div className={styles.topicExampleHead}>
                        <strong>{ex.title}</strong>
                        <span className="cu-chip-row">
                          <ComplexityBadge label="Time" value={ex.time_complexity} />
                          <ComplexityBadge label="Space" value={ex.space_complexity} />
                        </span>
                      </div>
                      <CodeBlock code={ex.code_text} language={ex.language} />
                      <div
                        className={`cu-prose ${styles.topicExampleAnalysis}`}
                        dangerouslySetInnerHTML={{ __html: ex.analysis_html }}
                      />
                    </div>
                  ))}
                </article>
              ))}
            </section>
          ))}
          {!topics.length && (
            <div className="cu-empty">
              <p>The library is being written. Check back soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
