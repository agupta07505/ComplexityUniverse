'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ComplexityBadge from './ComplexityBadge';
import CodeBlock from './CodeBlock';

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(String(dateString).replace(' ', 'T'));
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function parseJsonSafely(jsonString) {
  if (!jsonString) return null;
  if (typeof jsonString === 'object') return jsonString;
  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
}

export default function DashboardView({ profile, stats, analyses, savedTopics, activity }) {
  const [activeTab, setActiveTab] = useState('analyses');
  const [analysisList, setAnalysisList] = useState(analyses);
  const [topicList, setTopicList] = useState(savedTopics);
  const [expandedAnalysisId, setExpandedAnalysisId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: profile.name || '',
    headline: profile.headline || '',
    bio: profile.bio || '',
    location: profile.location || '',
  });
  const [profileSaveFeedback, setProfileSaveFeedback] = useState('');

  async function handleDeleteAnalysis(analysisId) {
    const response = await fetch(`/api/analyses/${analysisId}`, { method: 'DELETE' });
    if (response.ok) {
      setAnalysisList((prevList) => prevList.filter((item) => item.id !== analysisId));
      setStatusMessage('Analysis removed.');
      setTimeout(() => setStatusMessage(''), 2200);
    }
  }

  async function handleUnsaveTopic(bookmarkId) {
    const matchedTopic = topicList.find((item) => item.bookmark_id === bookmarkId);
    if (!matchedTopic) return;
    const response = await fetch(`/api/topics/${matchedTopic.topic_id}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (response.ok) {
      setTopicList((prevList) => prevList.filter((item) => item.bookmark_id !== bookmarkId));
      setStatusMessage('Topic removed from saved.');
      setTimeout(() => setStatusMessage(''), 2200);
    }
  }

  async function handleSaveProfile(event) {
    event.preventDefault();
    setProfileSaveFeedback('');
    const response = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileForm),
    });
    if (response.ok) {
      setProfileSaveFeedback('Profile updated.');
      setIsEditingProfile(false);
    } else {
      setProfileSaveFeedback('Could not update profile.');
    }
  }

  const userInitials = (profile.name || 'U')
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  return (
    <div className="cu-wrap cu-page">
      {/* -------- User Identity Banner -------- */}
      <div className="dashboard-hero">
        <div className="dashboard-profile-info">
          <span className="avatar-large">{userInitials}</span>
          <div>
            <h1 className="cu-display" style={{ fontSize: 30, marginBottom: 4 }}>
              {profile.name}
            </h1>
            <p style={{ color: 'var(--ink-2)', margin: 0 }}>
              {profile.headline || 'Curious about the cost of code'}
            </p>
            <div className="cu-chip-row" style={{ marginTop: 12 }}>
              <span className="cu-badge cu-badge-accent">{profile.rank_label || 'Newcomer'}</span>
              <span className="cu-badge cu-badge-plain">{profile.email}</span>
              {profile.location && <span className="cu-badge cu-badge-plain">{profile.location}</span>}
              <span className="cu-badge cu-badge-plain">
                Joined {formatDate(profile.created_at)}
              </span>
            </div>
          </div>
        </div>
        <Link href="/" className="cu-btn cu-btn-primary">
          + New analysis
        </Link>
      </div>

      {/* -------- Statistics Overview -------- */}
      <div className="cu-grid-4 stats-overview-grid">
        <div className="cu-stat">
          <div className="cu-stat-label">Saved analyses</div>
          <div className="cu-stat-value">{stats.total_analyses ?? analysisList.length}</div>
        </div>
        <div className="cu-stat">
          <div className="cu-stat-label">Bookmarked topics</div>
          <div className="cu-stat-value">{stats.saved_topics ?? topicList.length}</div>
        </div>
        <div className="cu-stat">
          <div className="cu-stat-label">Lines analyzed</div>
          <div className="cu-stat-value">{stats.lines_analyzed ?? 0}</div>
        </div>
        <div className="cu-stat">
          <div className="cu-stat-label">Most common cost</div>
          <div className="cu-stat-value mono" style={{ fontSize: 22 }}>
            {stats.most_common_complexity || '—'}
          </div>
        </div>
      </div>

      {statusMessage && <p className="cu-success-text" style={{ marginTop: 12 }}>{statusMessage}</p>}

      {/* -------- Tab Navigation -------- */}
      <div className="tabs-navigation">
        {[
          ['analyses', `Analyses (${analysisList.length})`],
          ['topics', `Saved topics (${topicList.length})`],
          ['profile', 'Profile'],
        ].map(([tabKey, tabLabel]) => (
          <button
            key={tabKey}
            type="button"
            className={`tab-button ${activeTab === tabKey ? 'is-active' : ''}`}
            onClick={() => setActiveTab(tabKey)}
          >
            {tabLabel}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ============ Analyses Tab ============ */}
        {activeTab === 'analyses' && (
          <motion.div
            key="analyses"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="dashboard-cards-list"
          >
            {analysisList.length === 0 && (
              <div className="cu-empty">
                <p>No saved analyses yet.</p>
                <p>
                  Paste code on the <Link href="/">home page</Link>, analyze it, then press
                  “Save to dashboard”.
                </p>
              </div>
            )}
            {analysisList.map((analysis) => {
              const details = expandedAnalysisId === analysis.id ? parseJsonSafely(analysis.detailed_analysis) : null;
              return (
                <div key={analysis.id} className="cu-card dashboard-card-item">
                  <div className="card-item-header">
                    <div style={{ minWidth: 0 }}>
                      <strong className="card-item-title">{analysis.title}</strong>
                      <div className="cu-chip-row" style={{ marginTop: 8 }}>
                        <span className="cu-badge cu-badge-plain">{analysis.language}</span>
                        <ComplexityBadge label="Time" value={analysis.time_complexity} />
                        <ComplexityBadge label="Space" value={analysis.space_complexity} />
                        <span className="cu-badge cu-badge-plain">{analysis.code_lines} lines</span>
                        <span className="cu-badge cu-badge-plain">{formatDate(analysis.created_at)}</span>
                        <span className="cu-badge cu-badge-plain">
                          {analysis.engine === 'gemini' ? 'Gemini' : 'AI'}
                        </span>
                      </div>
                      <p className="card-item-summary">{analysis.summary}</p>
                    </div>
                    <div className="card-item-actions">
                      <button
                        type="button"
                        className="cu-btn cu-btn-ghost cu-btn-sm"
                        onClick={() => setExpandedAnalysisId(expandedAnalysisId === analysis.id ? null : analysis.id)}
                      >
                        {expandedAnalysisId === analysis.id ? 'Hide details' : 'Details'}
                      </button>
                      <button
                        type="button"
                        className="cu-btn cu-btn-danger cu-btn-sm"
                        onClick={() => handleDeleteAnalysis(analysis.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {details && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="card-item-details"
                    >
                      {/* Cases & Breakdown Grid */}
                      <div className="result-grid" style={{ marginBottom: 18 }}>
                        <div className="cu-card cu-card-pad" style={{ background: 'var(--paper)' }}>
                          <h4 className="result-section-title">Complexity by case</h4>
                          <table className="cu-table">
                            <tbody>
                              <tr>
                                <td style={{ fontWeight: 620, width: '33%' }}>Best</td>
                                <td className="mono">{details.cases?.best || analysis.time_complexity}</td>
                              </tr>
                              <tr>
                                <td style={{ fontWeight: 620 }}>Average</td>
                                <td className="mono">{details.cases?.average || analysis.time_complexity}</td>
                              </tr>
                              <tr>
                                <td style={{ fontWeight: 620 }}>Worst</td>
                                <td className="mono">{details.cases?.worst || analysis.time_complexity}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div className="cu-card cu-card-pad" style={{ background: 'var(--paper)' }}>
                          <h4 className="result-section-title">Where the cost comes from</h4>
                          {Array.isArray(details.breakdown) && details.breakdown.length > 0 ? (
                            <ul className="cost-breakdown-list">
                              {details.breakdown.map((breakdownItem, index) => (
                                <li key={index}>
                                  <div className="cost-item-header">
                                    <strong>{breakdownItem.label}</strong>
                                    {breakdownItem.cost && <span className="mono cost-badge">{breakdownItem.cost}</span>}
                                  </div>
                                  <span>{breakdownItem.detail}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>No granular breakdown recorded.</p>
                          )}
                        </div>
                      </div>

                      {/* How this was measured */}
                      {details.approach && (
                        <div className="cu-card cu-card-pad" style={{ background: 'var(--paper)', marginBottom: 18 }}>
                          <h4 className="result-section-title">How this was measured</h4>
                          <p style={{ color: 'var(--ink-2)', margin: 0, lineHeight: 1.6 }}>{details.approach}</p>
                        </div>
                      )}

                      {/* Bottlenecks and Optimizations */}
                      <div className="result-grid" style={{ marginBottom: 18 }}>
                        <div className="cu-card cu-card-pad" style={{ background: 'var(--paper)' }}>
                          <h4 className="result-section-title">Bottlenecks</h4>
                          {Array.isArray(details.bottlenecks) && details.bottlenecks.length > 0 ? (
                            <ul className="warning-bullets">
                              {details.bottlenecks.map((bottleneck, index) => (
                                <li key={index}>{bottleneck}</li>
                              ))}
                            </ul>
                          ) : (
                            <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>None identified</p>
                          )}
                        </div>
                        <div className="cu-card cu-card-pad" style={{ background: 'var(--paper)' }}>
                          <h4 className="result-section-title">Optimization ideas</h4>
                          {Array.isArray(details.optimizations) && details.optimizations.length > 0 ? (
                            <ul className="good-bullets">
                              {details.optimizations.map((optimization, index) => (
                                <li key={index}>{optimization}</li>
                              ))}
                            </ul>
                          ) : (
                            <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>Already optimal</p>
                          )}
                        </div>
                      </div>

                      {/* Analyzed Code */}
                      {(analysis.code_text || details.code) && (
                        <div>
                          <h4 className="result-section-title" style={{ marginLeft: 2, marginBottom: 8 }}>
                            Analyzed code
                          </h4>
                          <CodeBlock code={analysis.code_text || details.code} language={analysis.language || 'code'} />
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        {/* ============ Saved Topics Tab ============ */}
        {activeTab === 'topics' && (
          <motion.div
            key="topics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="dashboard-cards-list"
          >
            {topicList.length === 0 && (
              <div className="cu-empty">
                <p>No saved topics yet.</p>
                <p>
                  Open the <Link href="/learn">Learn page</Link> and press “Save topic” on
                  anything worth revising.
                </p>
              </div>
            )}
            {topicList.map((topic) => (
              <div key={topic.bookmark_id} className="cu-card dashboard-card-item">
                <div className="card-item-header">
                  <div style={{ minWidth: 0 }}>
                    <strong className="card-item-title">{topic.topic_name}</strong>
                    <div className="cu-chip-row" style={{ marginTop: 8 }}>
                      <span className="cu-badge cu-badge-plain">{topic.category}</span>
                      <span className="cu-badge cu-badge-plain">{topic.difficulty}</span>
                      <ComplexityBadge label="Time" value={topic.time_complexity} />
                      <ComplexityBadge label="Space" value={topic.space_complexity} />
                      <span className="cu-badge cu-badge-plain">Saved {formatDate(topic.saved_at)}</span>
                    </div>
                    <p className="card-item-summary">{topic.summary}</p>
                  </div>
                  <div className="card-item-actions">
                    <Link href={`/learn#topic-${topic.slug}`} className="cu-btn cu-btn-ghost cu-btn-sm">
                      Open notes
                    </Link>
                    <button
                      type="button"
                      className="cu-btn cu-btn-danger cu-btn-sm"
                      onClick={() => handleUnsaveTopic(topic.bookmark_id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* ============ Profile Tab ============ */}
        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="cu-grid-2"
          >
            <div className="cu-card cu-card-pad">
              <h3 className="result-section-title">About you</h3>
              <table className="cu-table">
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 620 }}>Name</td>
                    <td>{profile.name}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 620 }}>Email</td>
                    <td>{profile.email}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 620 }}>Role</td>
                    <td>
                      {profile.role === 'admin' ? 'Administrator' : 'Member'} ·{' '}
                      {profile.rank_label}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 620 }}>Status</td>
                    <td>{profile.status || 'active'}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 620 }}>Last login</td>
                    <td>{profile.last_login_at || '—'}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 620 }}>Languages used</td>
                    <td>{stats.languages_used ?? 0}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 620 }}>Efficient analyses</td>
                    <td>{stats.efficient_count ?? 0} (O(1) / O(log n))</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="cu-btn cu-btn-primary cu-btn-sm"
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                >
                  {isEditingProfile ? 'Close editor' : 'Edit profile'}
                </button>
                {profileSaveFeedback && <span className="cu-success-text">{profileSaveFeedback}</span>}
              </div>

              {isEditingProfile && (
                <form onSubmit={handleSaveProfile} style={{ marginTop: 18 }}>
                  <label className="cu-field">
                    <span className="cu-label">Name</span>
                    <input
                      className="cu-input"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    />
                  </label>
                  <label className="cu-field">
                    <span className="cu-label">Headline</span>
                    <input
                      className="cu-input"
                      value={profileForm.headline}
                      onChange={(e) => setProfileForm({ ...profileForm, headline: e.target.value })}
                    />
                  </label>
                  <label className="cu-field">
                    <span className="cu-label">Bio</span>
                    <textarea
                      className="cu-textarea"
                      rows={3}
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    />
                  </label>
                  <label className="cu-field">
                    <span className="cu-label">Location</span>
                    <input
                      className="cu-input"
                      value={profileForm.location}
                      onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                    />
                  </label>
                  <button className="cu-btn cu-btn-accent cu-btn-sm" type="submit">
                    Save changes
                  </button>
                </form>
              )}
            </div>

            <div className="cu-card cu-card-pad">
              <h3 className="result-section-title">Recent activity</h3>
              <ul className="activity-timeline-list">
                {(activity || []).map((activityItem, index) => (
                  <li key={index}>
                    <span
                      className={`status-dot ${
                        activityItem.action.includes('deleted') || activityItem.action.includes('unsaved')
                          ? 'status-dot-warning'
                          : 'status-dot-success'
                      }`}
                    />
                    <div>
                      <strong>
                        {activityItem.action.replace(/_/g, ' ')}
                        {activityItem.detail ? ` · ${activityItem.detail}` : ''}
                      </strong>
                      <div className="cu-hint">{activityItem.created_at}</div>
                    </div>
                  </li>
                ))}
                {!activity?.length && <li className="cu-hint">No activity yet.</li>}
              </ul>

              <hr className="cu-divider" />
              <h3 className="result-section-title">Database-backed facts</h3>
              <p className="cu-hint">
                Counts and rank labels are computed live by MySQL views (v_user_overview),
                and every saved analysis is kept in the code_analyses table with foreign
                keys, cascade rules and triggers maintaining the counters.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
