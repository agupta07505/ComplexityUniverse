'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import ComplexityBadge from './ComplexityBadge';
import CodeBlock from './CodeBlock';

function SaveTopicButton({ topicId }) {
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saved | loading
  const [errorMessage, setErrorMessage] = useState('');

  async function handleToggleSave() {
    setSaveStatus('loading');
    setErrorMessage('');
    try {
      const response = await fetch(`/api/topics/${topicId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save topic');
      setSaveStatus(data.saved ? 'saved' : 'idle');
    } catch (error) {
      setErrorMessage(error.message);
      setSaveStatus('idle');
    }
  }

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
      <button
        type="button"
        className={`cu-btn cu-btn-sm ${saveStatus === 'saved' ? 'cu-btn-accent' : 'cu-btn-ghost'}`}
        onClick={handleToggleSave}
      >
        {saveStatus === 'saved' ? '★ Saved' : '☆ Save topic'}
      </button>
      {errorMessage && (
        <span className="cu-error-text" style={{ fontSize: 12 }}>
          {errorMessage === 'Sign in to save topics.' ? (
            <>
              <Link href="/login">Sign in</Link> to save
            </>
          ) : (
            errorMessage
          )}
        </span>
      )}
    </span>
  );
}

export default function LearnView({ topics }) {
  const [filterQuery, setFilterQuery] = useState('');
  const [activeTopicSlug, setActiveTopicSlug] = useState(topics[0]?.slug || '');
  const contentAreaRef = useRef(null);

  const groupedCategories = useMemo(() => {
    const searchKeyword = filterQuery.trim().toLowerCase();
    const filteredTopics = topics.filter(
      (topic) =>
        !searchKeyword ||
        topic.topic_name.toLowerCase().includes(searchKeyword) ||
        topic.summary.toLowerCase().includes(searchKeyword) ||
        topic.category.toLowerCase().includes(searchKeyword)
    );
    const categoryMap = new Map();
    for (const topic of filteredTopics) {
      if (!categoryMap.has(topic.category)) categoryMap.set(topic.category, []);
      categoryMap.get(topic.category).push(topic);
    }
    return [...categoryMap.entries()];
  }, [topics, filterQuery]);

  // Scroll-spy: highlight the topic currently visible on screen
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveTopicSlug(entry.target.id.replace('topic-', ''));
            break;
          }
        }
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: 0.01 }
    );
    document.querySelectorAll('.topic-article-card').forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [groupedCategories]);

  return (
    <div className="cu-wrap cu-page">
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

      <div className="learn-layout">
        {/* -------- Left Sidebar: Topic List -------- */}
        <aside className="learn-sidebar">
          <input
            className="cu-input topic-filter-input"
            placeholder="Filter topics…"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
          />
          <nav className="sidebar-navigation">
            {groupedCategories.map(([categoryName, categoryTopics]) => (
              <div key={categoryName} className="category-group">
                <div className="category-group-title">{categoryName}</div>
                {categoryTopics.map((topic) => (
                  <a
                    key={topic.id}
                    href={`#topic-${topic.slug}`}
                    className={`topic-nav-link ${activeTopicSlug === topic.slug ? 'is-active' : ''}`}
                  >
                    <span>{topic.topic_name}</span>
                    {topic.time_complexity && <span className="mono topic-complexity-tag">{topic.time_complexity}</span>}
                  </a>
                ))}
              </div>
            ))}
            {!groupedCategories.length && <p className="cu-hint">No topics match “{filterQuery}”.</p>}
          </nav>
        </aside>

        {/* -------- Right Side: Topic Content & Examples -------- */}
        <div ref={contentAreaRef}>
          {groupedCategories.map(([categoryName, categoryTopics]) => (
            <section key={categoryName} className="category-section">
              <h2 className="category-heading">{categoryName}</h2>

              {categoryTopics.map((topic) => (
                <article
                  key={topic.id}
                  id={`topic-${topic.slug}`}
                  className="cu-card topic-article-card"
                >
                  <header className="topic-header">
                    <div>
                      <h3 className="topic-title">{topic.topic_name}</h3>
                      <p className="topic-summary-text">{topic.summary}</p>
                      <div className="cu-chip-row">
                        <span className="cu-badge cu-badge-plain">{topic.difficulty}</span>
                        <ComplexityBadge label="Time" value={topic.time_complexity} />
                        <ComplexityBadge label="Space" value={topic.space_complexity} />
                        {topic.example_count > 0 && (
                          <span className="cu-badge cu-badge-plain">
                            {topic.example_count} example{topic.example_count > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <SaveTopicButton topicId={topic.id} />
                  </header>

                  <div className="cu-prose" dangerouslySetInnerHTML={{ __html: topic.notes_html }} />

                  {(topic.examples || []).map((example) => (
                    <div key={example.id} className="example-card">
                      <div className="example-header">
                        <strong>{example.title}</strong>
                        <span className="cu-chip-row">
                          <ComplexityBadge label="Time" value={example.time_complexity} />
                          <ComplexityBadge label="Space" value={example.space_complexity} />
                        </span>
                      </div>
                      <CodeBlock code={example.code_text} language={example.language} />
                      <div
                        className="cu-prose example-analysis-notes"
                        dangerouslySetInnerHTML={{ __html: example.analysis_html }}
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
