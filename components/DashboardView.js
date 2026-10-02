'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ComplexityBadge from './ComplexityBadge';
import CodeBlock from './CodeBlock';

function formatDate(s) {
  if (!s) return '';
  const d = new Date(String(s).replace(' ', 'T'));
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function DashboardView({ profile, stats, analyses, savedTopics, activity }) {
  const [tab, setTab] = useState('analyses');
  const [rows, setRows] = useState(analyses);
  const [topics, setTopics] = useState(savedTopics);
  const [openId, setOpenId] = useState(null);
  const [flash, setFlash] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    name: profile.name || '',
    headline: profile.headline || '',
    bio: profile.bio || '',
    location: profile.location || '',
  });
  const [profileMsg, setProfileMsg] = useState('');

  async function deleteAnalysis(id) {
    const res = await fetch(`/api/analyses/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setRows((r) => r.filter((x) => x.id !== id));
      setFlash('Analysis removed.');
      setTimeout(() => setFlash(''), 2200);
    }
  }

  async function unsaveTopic(bookmarkId) {
    const t = topics.find((x) => x.bookmark_id === bookmarkId);
    if (!t) return;
    const res = await fetch(`/api/topics/${t.topic_id}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (res.ok) {
      setTopics((list) => list.filter((x) => x.bookmark_id !== bookmarkId));
      setFlash('Topic removed from saved.');
      setTimeout(() => setFlash(''), 2200);
    }
  }

  async function saveProfile(e) {
    e.preventDefault();
    setProfileMsg('');
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setProfileMsg('Profile updated.');
      setEditOpen(false);
    } else {
      setProfileMsg('Could not update profile.');
    }
  }

  const initials = (profile.name || 'U')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="cu-wrap cu-page">
      {/* -------- identity banner -------- */}
      <div className="cu-dash-hero">
        <div className="cu-dash-id">
          <span className="cu-avatar cu-avatar-lg">{initials}</span>
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

      {/* -------- stat cards -------- */}
      <div className="cu-grid-4 cu-dash-stats">
        <div className="cu-stat">
          <div className="cu-stat-label">Saved analyses</div>
          <div className="cu-stat-value">{stats.total_analyses ?? rows.length}</div>
        </div>
        <div className="cu-stat">
          <div className="cu-stat-label">Bookmarked topics</div>
          <div className="cu-stat-value">{stats.saved_topics ?? topics.length}</div>
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

      {flash && <p className="cu-success-text" style={{ marginTop: 12 }}>{flash}</p>}

      {/* -------- tabs -------- */}
      <div className="cu-tabs">
        {[
          ['analyses', `Analyses (${rows.length})`],
          ['topics', `Saved topics (${topics.length})`],
          ['profile', 'Profile'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`cu-tab ${tab === key ? 'is-on' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ============ analyses tab ============ */}
        {tab === 'analyses' && (
          <motion.div
            key="analyses"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="cu-dash-list"
          >
            {rows.length === 0 && (
              <div className="cu-empty">
                <p>No saved analyses yet.</p>
                <p>
                  Paste code on the <Link href="/">home page</Link>, analyze it, then press
                  “Save to dashboard”.
                </p>
              </div>
            )}
            {rows.map((a) => {
              const detail = openId === a.id ? safeParse(a.detailed_analysis) : null;
              return (
                <div key={a.id} className="cu-card cu-dash-item">
                  <div className="cu-dash-item-head">
                    <div style={{ minWidth: 0 }}>
                      <strong className="cu-dash-item-title">{a.title}</strong>
                      <div className="cu-chip-row" style={{ marginTop: 8 }}>
                        <span className="cu-badge cu-badge-plain">{a.language}</span>
                        <ComplexityBadge label="Time" value={a.time_complexity} />
                        <ComplexityBadge label="Space" value={a.space_complexity} />
                        <span className="cu-badge cu-badge-plain">{a.code_lines} lines</span>
                        <span className="cu-badge cu-badge-plain">{formatDate(a.created_at)}</span>
                        <span className="cu-badge cu-badge-plain">
                          {a.engine === 'gemini' ? 'Gemini' : 'AI'}
                        </span>
                      </div>
                      <p className="cu-dash-item-summary">{a.summary}</p>
                    </div>
                    <div className="cu-dash-item-actions">
                      <button
                        type="button"
                        className="cu-btn cu-btn-ghost cu-btn-sm"
                        onClick={() => setOpenId(openId === a.id ? null : a.id)}
                      >
                        {openId === a.id ? 'Hide details' : 'Details'}
                      </button>
                      <button
                        type="button"
                        className="cu-btn cu-btn-danger cu-btn-sm"
                        onClick={() => deleteAnalysis(a.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {detail && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="cu-dash-detail"
                    >
                      {detail.approach && (
                        <p style={{ color: 'var(--ink-2)' }}>{detail.approach}</p>
                      )}
                      <div className="cu-grid-2">
                        <div>
                          <div className="cu-result-h3">Bottlenecks</div>
                          <ul className="cu-bullet-warn">
                            {(detail.bottlenecks || []).map((x, i) => (
                              <li key={i}>{x}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="cu-result-h3">Optimizations</div>
                          <ul className="cu-bullet-good">
                            {(detail.optimizations || []).map((x, i) => (
                              <li key={i}>{x}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        {/* ============ saved topics tab ============ */}
        {tab === 'topics' && (
          <motion.div
            key="topics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="cu-dash-list"
          >
            {topics.length === 0 && (
              <div className="cu-empty">
                <p>No saved topics yet.</p>
                <p>
                  Open the <Link href="/learn">Learn page</Link> and press “Save topic” on
                  anything worth revising.
                </p>
              </div>
            )}
            {topics.map((t) => (
              <div key={t.bookmark_id} className="cu-card cu-dash-item">
                <div className="cu-dash-item-head">
                  <div style={{ minWidth: 0 }}>
                    <strong className="cu-dash-item-title">{t.topic_name}</strong>
                    <div className="cu-chip-row" style={{ marginTop: 8 }}>
                      <span className="cu-badge cu-badge-plain">{t.category}</span>
                      <span className="cu-badge cu-badge-plain">{t.difficulty}</span>
                      <ComplexityBadge label="Time" value={t.time_complexity} />
                      <ComplexityBadge label="Space" value={t.space_complexity} />
                      <span className="cu-badge cu-badge-plain">Saved {formatDate(t.saved_at)}</span>
                    </div>
                    <p className="cu-dash-item-summary">{t.summary}</p>
                  </div>
                  <div className="cu-dash-item-actions">
                    <Link href={`/learn#topic-${t.slug}`} className="cu-btn cu-btn-ghost cu-btn-sm">
                      Open notes
                    </Link>
                    <button
                      type="button"
                      className="cu-btn cu-btn-danger cu-btn-sm"
                      onClick={() => unsaveTopic(t.bookmark_id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* ============ profile tab ============ */}
        {tab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="cu-grid-2"
          >
            <div className="cu-card cu-card-pad">
              <h3 className="cu-result-h3">About you</h3>
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
                  onClick={() => setEditOpen(!editOpen)}
                >
                  {editOpen ? 'Close editor' : 'Edit profile'}
                </button>
                {profileMsg && <span className="cu-success-text">{profileMsg}</span>}
              </div>

              {editOpen && (
                <form onSubmit={saveProfile} style={{ marginTop: 18 }}>
                  <label className="cu-field">
                    <span className="cu-label">Name</span>
                    <input
                      className="cu-input"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </label>
                  <label className="cu-field">
                    <span className="cu-label">Headline</span>
                    <input
                      className="cu-input"
                      value={form.headline}
                      onChange={(e) => setForm({ ...form, headline: e.target.value })}
                    />
                  </label>
                  <label className="cu-field">
                    <span className="cu-label">Bio</span>
                    <textarea
                      className="cu-textarea"
                      rows={3}
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    />
                  </label>
                  <label className="cu-field">
                    <span className="cu-label">Location</span>
                    <input
                      className="cu-input"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                    />
                  </label>
                  <button className="cu-btn cu-btn-accent cu-btn-sm" type="submit">
                    Save changes
                  </button>
                </form>
              )}
            </div>

            <div className="cu-card cu-card-pad">
              <h3 className="cu-result-h3">Recent activity</h3>
              <ul className="cu-activity">
                {(activity || []).map((a, i) => (
                  <li key={i}>
                    <span className={`cu-dot cu-dot-${a.action.includes('deleted') || a.action.includes('unsaved') ? 'warn' : 'ok'}`} />
                    <div>
                      <strong>
                        {a.action.replace(/_/g, ' ')}
                        {a.detail ? ` · ${a.detail}` : ''}
                      </strong>
                      <div className="cu-hint">{a.created_at}</div>
                    </div>
                  </li>
                ))}
                {!activity?.length && <li className="cu-hint">No activity yet.</li>}
              </ul>

              <hr className="cu-divider" />
              <h3 className="cu-result-h3">Database-backed facts</h3>
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
