'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import ComplexityBadge from '@/components/ComplexityBadge';

const EMPTY_TOPIC = {
  topic_name: '',
  category: 'Fundamentals',
  difficulty: 'Beginner',
  time_complexity: '',
  space_complexity: '',
  summary: '',
  notes_html: '<h2>Overview</h2>\n<p></p>\n<h3>Key points</h3>\n<ul>\n  <li></li>\n</ul>',
  sort_order: 100,
  is_published: true,
};

const EMPTY_EXAMPLE = {
  title: '',
  language: 'javascript',
  code_text: '',
  analysis_html: '<p></p>',
  time_complexity: '',
  space_complexity: '',
  sort_order: 10,
};

export default function AdminPage() {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [creds, setCreds] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [topics, setTopics] = useState([]);
  const [prompt, setPrompt] = useState(null);
  const [promptText, setPromptText] = useState('');
  const [promptName, setPromptName] = useState('');
  const [promptMsg, setPromptMsg] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-3.5-flash');
  const [settingsMsg, setSettingsMsg] = useState('');
  const [users, setUsers] = useState([]);

  const [editing, setEditing] = useState(null); // topic form state
  const [editId, setEditId] = useState(null);
  const [topicMsg, setTopicMsg] = useState('');

  const [exampleTopic, setExampleTopic] = useState(null); // topic id whose examples we manage
  const [exampleList, setExampleList] = useState([]);
  const [exampleForm, setExampleForm] = useState(EMPTY_EXAMPLE);
  const [exampleEditId, setExampleEditId] = useState(null);
  const [exampleMsg, setExampleMsg] = useState('');

  /* ---------- auth gate ---------- */
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, []);

  async function adminLogin(e) {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoginError(data.error || 'Login failed');
      return;
    }
    if (data.user.role !== 'admin') {
      setLoginError('This account does not have admin rights.');
      await fetch('/api/auth/logout', { method: 'POST' });
      return;
    }
    setUser(data.user);
  }

  /* ---------- data ---------- */
  const loadAll = useCallback(async () => {
    const [s, t, p, u, st] = await Promise.all([
      fetch('/api/admin/stats').then((r) => r.json()),
      fetch('/api/admin/topics').then((r) => r.json()),
      fetch('/api/admin/prompt').then((r) => r.json()),
      fetch('/api/admin/users').then((r) => r.json()),
      fetch('/api/admin/settings').then((r) => r.json()),
    ]);
    setStats(s);
    setTopics(t.topics || []);
    if (p.active) {
      setPrompt(p.active);
      setPromptText(p.active.prompt_template);
      setPromptName(p.active.name);
    }
    if (st.settings) {
      setGeminiKey(st.settings.gemini_api_key || '');
      setGeminiModel(st.settings.gemini_model || 'gemini-3.5-flash');
    }
    setUsers(u.users || []);
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') loadAll();
  }, [user, loadAll]);

  /* ---------- topic ops ---------- */
  function startNewTopic() {
    setEditing({ ...EMPTY_TOPIC });
    setEditId(null);
    setTopicMsg('');
  }

  function startEditTopic(t) {
    setEditing({
      topic_name: t.topic_name,
      category: t.category,
      difficulty: t.difficulty,
      time_complexity: t.time_complexity || '',
      space_complexity: t.space_complexity || '',
      summary: t.summary || '',
      notes_html: t.notes_html || '',
      sort_order: t.sort_order ?? 100,
      is_published: Number(t.is_published) === 1,
    });
    setEditId(t.id);
    setTopicMsg('');
  }

  async function saveTopic(e) {
    e.preventDefault();
    setTopicMsg('');
    const payload = {
      ...editing,
      is_published: editing.is_published !== false,
    };
    const res = await fetch(editId ? `/api/admin/topics/${editId}` : '/api/admin/topics', {
      method: editId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setTopicMsg(data.error || 'Save failed');
      return;
    }
    setTopicMsg(editId ? 'Topic updated.' : 'Topic created.');
    setEditing(null);
    setEditId(null);
    loadAll();
  }

  async function deleteTopic(id) {
    if (!window.confirm('Delete this topic, its examples and all bookmarks?')) return;
    const res = await fetch(`/api/admin/topics/${id}`, { method: 'DELETE' });
    const data = await res.json();
    setTopicMsg(res.ok ? 'Topic deleted.' : data.error || 'Delete failed');
    loadAll();
  }

  /* ---------- example ops ---------- */
  async function openExamples(t) {
    setExampleTopic(t);
    setExampleForm(EMPTY_EXAMPLE);
    setExampleEditId(null);
    setExampleMsg('');
    const res = await fetch(`/api/topics/${t.id}`);
    const data = await res.json();
    setExampleList(data.topic?.examples || []);
  }

  async function saveExample(e) {
    e.preventDefault();
    setExampleMsg('');
    const payload = { ...exampleForm, topic_id: exampleTopic.id };
    const res = await fetch(
      exampleEditId ? `/api/admin/examples/${exampleEditId}` : '/api/admin/examples',
      {
        method: exampleEditId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      setExampleMsg(data.error || 'Save failed');
      return;
    }
    setExampleMsg(exampleEditId ? 'Example updated.' : 'Example added.');
    setExampleForm(EMPTY_EXAMPLE);
    setExampleEditId(null);
    openExamples(exampleTopic);
    loadAll();
  }

  async function deleteExample(id) {
    if (!window.confirm('Delete this example?')) return;
    await fetch(`/api/admin/examples/${id}`, { method: 'DELETE' });
    openExamples(exampleTopic);
    loadAll();
  }

  /* ---------- AI settings ops ---------- */
  async function saveGemini(e) {
    e.preventDefault();
    setSettingsMsg('');
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gemini_api_key: geminiKey, gemini_model: geminiModel }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSettingsMsg(data.error || 'Save failed');
      return;
    }
    setSettingsMsg(geminiKey.trim() ? 'Saved. Gemini is connected.' : 'Saved. API key cleared.');
    loadAll();
  }

  /* ---------- prompt ops ---------- */
  async function savePrompt(e) {
    e.preventDefault();
    setPromptMsg('');
    const res = await fetch('/api/admin/prompt', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt_template: promptText, name: promptName }),
    });
    const data = await res.json();
    if (!res.ok) {
      setPromptMsg(data.error || 'Save failed');
      return;
    }
    setPromptMsg(`Saved — now prompt version v${data.prompt?.version}.`);
    loadAll();
  }

  /* ---------- user ops ---------- */
  async function patchUser(id, patch) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) alert(data.error || 'Update failed');
    loadAll();
  }

  async function deleteUser(id) {
    if (!window.confirm('Delete this user? Their analyses and bookmarks are removed with them.')) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) alert(data.error || 'Delete failed');
    loadAll();
  }

  /* ---------- render: gates ---------- */
  if (user === undefined) {
    return (
      <div className="cu-wrap cu-page">
        <div className="cu-empty">Checking credentials…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="cu-auth">
        <div className="cu-wrap" style={{ maxWidth: 460 }}>
          <div className="cu-auth-card">
            <span className="cu-eyebrow">Admin access</span>
            <h2>Administrator sign-in</h2>
            <p className="cu-auth-sub">
              The console manages the Learn library and the AI analysis prompt.
            </p>
            <form onSubmit={adminLogin}>
              <label className="cu-field">
                <span className="cu-label">Admin email</span>
                <input
                  className="cu-input"
                  type="email"
                  value={creds.email}
                  onChange={(e) => setCreds({ ...creds, email: e.target.value })}
                  required
                />
              </label>
              <label className="cu-field">
                <span className="cu-label">Password</span>
                <input
                  className="cu-input"
                  type="password"
                  value={creds.password}
                  onChange={(e) => setCreds({ ...creds, password: e.target.value })}
                  required
                />
              </label>
              {loginError && <p className="cu-error-text">{loginError}</p>}
              <button className="cu-btn cu-btn-primary cu-btn-block" type="submit">
                Sign in to console
              </button>
            </form>
            <p className="cu-auth-alt">
              Not an admin? <Link href="/login">Regular sign-in</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="cu-wrap cu-page">
        <div className="cu-empty">
          <h2 style={{ color: 'var(--ink)' }}>Admin rights required</h2>
          <p>
            Signed in as {user.email}. Ask an administrator for access, or{' '}
            <Link href="/dashboard">return to your dashboard</Link>.
          </p>
        </div>
      </div>
    );
  }

  /* ---------- render: console ---------- */
  return (
    <div className="cu-wrap cu-page">
      <div className="cu-dash-hero" style={{ marginBottom: 24 }}>
        <div>
          <span className="cu-eyebrow">Admin console</span>
          <h1 className="cu-display" style={{ fontSize: 30, marginBottom: 6 }}>
            Manage ComplexityUniverse
          </h1>
          <p style={{ color: 'var(--ink-2)', margin: 0 }}>
            Learn library, AI analysis prompt and user accounts — all backed by MySQL
            transactions, triggers and cascade rules.
          </p>
        </div>
        <div className="cu-chip-row">
          <span className="cu-badge cu-badge-accent">Signed in as {user.name}</span>
        </div>
      </div>

      <div className="cu-tabs">
        {[
          ['overview', 'Overview'],
          ['topics', 'Complexity topics'],
          ['prompt', 'AI settings'],
          ['users', 'Users'],
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

      {/* ================= overview ================= */}
      {tab === 'overview' && (
        <div>
          <div className="cu-grid-4">
            {[
              ['Users', stats?.totals?.users],
              ['Analyses saved', stats?.totals?.analyses],
              ['Topics', stats?.totals?.topics],
              ['Code examples', stats?.totals?.examples],
              ['Bookmarks', stats?.totals?.bookmarks],
              ['Log entries', stats?.totals?.log_entries],
            ].map(([label, val]) => (
              <div key={label} className="cu-stat">
                <div className="cu-stat-label">{label}</div>
                <div className="cu-stat-value">{val ?? '—'}</div>
              </div>
            ))}
          </div>

          <div className="cu-grid-2" style={{ marginTop: 20 }}>
            <div className="cu-card cu-card-pad">
              <h3 className="cu-result-h3">Complexity distribution</h3>
              <table className="cu-table">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Count</th>
                    <th>Bucket</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.distribution || []).map((d) => (
                    <tr key={d.time_complexity}>
                      <td>
                        <ComplexityBadge label="" value={d.time_complexity} />
                      </td>
                      <td>{d.total}</td>
                      <td>{d.bucket}</td>
                    </tr>
                  ))}
                  {!stats?.distribution?.length && (
                    <tr>
                      <td colSpan={3} className="cu-hint">
                        No analyses yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="cu-card cu-card-pad">
              <h3 className="cu-result-h3">Recent activity</h3>
              <ul className="cu-activity">
                {(stats?.recent || []).map((r, i) => (
                  <li key={i}>
                    <span className="cu-dot cu-dot-ok" />
                    <div>
                      <strong>{r.action.replace(/_/g, ' ')}</strong> — {r.entity}
                      {r.detail ? ` · ${r.detail}` : ''}
                      <div className="cu-hint">{r.created_at}</div>
                    </div>
                  </li>
                ))}
                {!stats?.recent?.length && <li className="cu-hint">Nothing logged yet.</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ================= topics ================= */}
      {tab === 'topics' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, margin: 0 }}>Complexity topics ({topics.length})</h2>
            <button type="button" className="cu-btn cu-btn-accent cu-btn-sm" onClick={startNewTopic}>
              + Add topic
            </button>
          </div>

          {topicMsg && <p className="cu-success-text">{topicMsg}</p>}

          {editing && (
            <form className="cu-card cu-card-pad cu-admin-form" onSubmit={saveTopic}>
              <h3 style={{ marginTop: 0 }}>{editId ? 'Edit topic' : 'New topic'}</h3>
              <div className="cu-grid-2">
                <label className="cu-field">
                  <span className="cu-label">Topic name</span>
                  <input
                    className="cu-input"
                    value={editing.topic_name}
                    onChange={(e) => setEditing({ ...editing, topic_name: e.target.value })}
                    required
                  />
                </label>
                <label className="cu-field">
                  <span className="cu-label">Category</span>
                  <select
                    className="cu-select"
                    value={editing.category}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  >
                    {['Fundamentals', 'Common Complexities', 'Data Structures & Algorithms', 'Techniques'].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label className="cu-field">
                  <span className="cu-label">Difficulty</span>
                  <select
                    className="cu-select"
                    value={editing.difficulty}
                    onChange={(e) => setEditing({ ...editing, difficulty: e.target.value })}
                  >
                    {['Beginner', 'Intermediate', 'Advanced'].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label className="cu-field">
                  <span className="cu-label">Sort order</span>
                  <input
                    className="cu-input"
                    type="number"
                    value={editing.sort_order}
                    onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
                  />
                </label>
                <label className="cu-field">
                  <span className="cu-label">Time complexity</span>
                  <input
                    className="cu-input"
                    placeholder="e.g. O(n log n)"
                    value={editing.time_complexity}
                    onChange={(e) => setEditing({ ...editing, time_complexity: e.target.value })}
                  />
                </label>
                <label className="cu-field">
                  <span className="cu-label">Space complexity</span>
                  <input
                    className="cu-input"
                    placeholder="e.g. O(n)"
                    value={editing.space_complexity}
                    onChange={(e) => setEditing({ ...editing, space_complexity: e.target.value })}
                  />
                </label>
              </div>

              <label className="cu-field">
                <span className="cu-label">Summary</span>
                <input
                  className="cu-input"
                  value={editing.summary}
                  onChange={(e) => setEditing({ ...editing, summary: e.target.value })}
                />
              </label>

              <label className="cu-field">
                <span className="cu-label">Notes (HTML)</span>
                <textarea
                  className="cu-textarea"
                  rows={12}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
                  value={editing.notes_html}
                  onChange={(e) => setEditing({ ...editing, notes_html: e.target.value })}
                />
                <span className="cu-hint">
                  Rendered on the Learn page. Tags allowed: h2, h3, p, ul, li, strong, em, code, table.
                </span>
              </label>

              <label style={{ display: 'flex', gap: 9, alignItems: 'center', marginBottom: 16 }}>
                <input
                  type="checkbox"
                  checked={editing.is_published !== false}
                  onChange={(e) => setEditing({ ...editing, is_published: e.target.checked })}
                />
                <span className="cu-label" style={{ margin: 0 }}>Published on Learn page</span>
              </label>

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="cu-btn cu-btn-primary cu-btn-sm" type="submit">
                  {editId ? 'Save topic' : 'Create topic'}
                </button>
                <button className="cu-btn cu-btn-ghost cu-btn-sm" type="button" onClick={() => setEditing(null)}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* examples manager */}
          {exampleTopic && (
            <div className="cu-card cu-card-pad" style={{ marginTop: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Examples — {exampleTopic.topic_name}</h3>
                <button className="cu-btn cu-btn-ghost cu-btn-sm" type="button" onClick={() => setExampleTopic(null)}>
                  Close
                </button>
              </div>

              <ul className="cu-admin-exlist">
                {exampleList.map((ex) => (
                  <li key={ex.id}>
                    <div>
                      <strong>{ex.title}</strong>{' '}
                      <span className="cu-hint">({ex.language})</span>
                      <div className="cu-chip-row" style={{ marginTop: 6 }}>
                        <ComplexityBadge label="Time" value={ex.time_complexity} />
                        <ComplexityBadge label="Space" value={ex.space_complexity} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="cu-btn cu-btn-ghost cu-btn-sm"
                        type="button"
                        onClick={() => {
                          setExampleEditId(ex.id);
                          setExampleForm({
                            title: ex.title,
                            language: ex.language,
                            code_text: ex.code_text,
                            analysis_html: ex.analysis_html,
                            time_complexity: ex.time_complexity || '',
                            space_complexity: ex.space_complexity || '',
                            sort_order: ex.sort_order ?? 10,
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button className="cu-btn cu-btn-danger cu-btn-sm" type="button" onClick={() => deleteExample(ex.id)}>
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
                {!exampleList.length && <li className="cu-hint">No examples yet.</li>}
              </ul>

              <hr className="cu-divider" />
              {exampleMsg && <p className="cu-success-text">{exampleMsg}</p>}
              <form onSubmit={saveExample}>
                <div className="cu-grid-2">
                  <label className="cu-field">
                    <span className="cu-label">Example title</span>
                    <input
                      className="cu-input"
                      value={exampleForm.title}
                      onChange={(e) => setExampleForm({ ...exampleForm, title: e.target.value })}
                      required
                    />
                  </label>
                  <label className="cu-field">
                    <span className="cu-label">Language</span>
                    <select
                      className="cu-select"
                      value={exampleForm.language}
                      onChange={(e) => setExampleForm({ ...exampleForm, language: e.target.value })}
                    >
                      {['javascript', 'python', 'java', 'cpp', 'go', 'rust'].map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  </label>
                  <label className="cu-field">
                    <span className="cu-label">Time complexity</span>
                    <input
                      className="cu-input"
                      value={exampleForm.time_complexity}
                      onChange={(e) => setExampleForm({ ...exampleForm, time_complexity: e.target.value })}
                    />
                  </label>
                  <label className="cu-field">
                    <span className="cu-label">Space complexity</span>
                    <input
                      className="cu-input"
                      value={exampleForm.space_complexity}
                      onChange={(e) => setExampleForm({ ...exampleForm, space_complexity: e.target.value })}
                    />
                  </label>
                </div>
                <label className="cu-field">
                  <span className="cu-label">Code</span>
                  <textarea
                    className="cu-textarea"
                    rows={7}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
                    value={exampleForm.code_text}
                    onChange={(e) => setExampleForm({ ...exampleForm, code_text: e.target.value })}
                    required
                  />
                </label>
                <label className="cu-field">
                  <span className="cu-label">Analysis (HTML)</span>
                  <textarea
                    className="cu-textarea"
                    rows={4}
                    value={exampleForm.analysis_html}
                    onChange={(e) => setExampleForm({ ...exampleForm, analysis_html: e.target.value })}
                  />
                </label>
                <button className="cu-btn cu-btn-primary cu-btn-sm" type="submit">
                  {exampleEditId ? 'Update example' : 'Add example'}
                </button>
              </form>
            </div>
          )}

          {/* topic table */}
          <div className="cu-card" style={{ marginTop: 18, overflow: 'hidden' }}>
            <div className="cu-table-wrap">
              <table className="cu-table">
                <thead>
                  <tr>
                    <th>Topic</th>
                    <th>Category</th>
                    <th>Difficulty</th>
                    <th>Complexity</th>
                    <th>Examples</th>
                    <th>Bookmarks</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {topics.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 620 }}>{t.topic_name}</td>
                      <td>{t.category}</td>
                      <td>{t.difficulty}</td>
                      <td>
                        <ComplexityBadge label="" value={t.time_complexity} />
                      </td>
                      <td>{t.example_count ?? 0}</td>
                      <td>{t.saved_count ?? 0}</td>
                      <td>
                        {Number(t.is_published) === 1 ? (
                          <span className="cu-badge cu-badge-green">Published</span>
                        ) : (
                          <span className="cu-badge cu-badge-amber">Draft</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button className="cu-btn cu-btn-ghost cu-btn-sm" type="button" onClick={() => startEditTopic(t)}>
                            Edit
                          </button>
                          <button className="cu-btn cu-btn-ghost cu-btn-sm" type="button" onClick={() => openExamples(t)}>
                            Examples
                          </button>
                          <button className="cu-btn cu-btn-danger cu-btn-sm" type="button" onClick={() => deleteTopic(t.id)}>
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= AI settings ================= */}
      {tab === 'prompt' && (
        <div>
          {/* Gemini connection */}
          <form className="cu-card cu-card-pad" onSubmit={saveGemini} style={{ marginBottom: 18 }}>
            <h3 style={{ marginTop: 0 }}>Gemini API connection</h3>
            <p className="cu-hint" style={{ marginBottom: 16 }}>
              Paste your Google Gemini API key here — every analysis on the home page is
              answered by Gemini. Get a free key at{' '}
              <span className="mono">aistudio.google.com/apikey</span>. The key is stored in
              the MySQL table <span className="mono">app_settings</span>.
            </p>

            <div className="cu-grid-2">
              <label className="cu-field">
                <span className="cu-label">Gemini API key</span>
                <input
                  className="cu-input mono"
                  type="password"
                  placeholder="AIza..."
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  autoComplete="off"
                />
                <span className="cu-hint">
                  {geminiKey.trim() ? 'A key is saved.' : 'No key set yet — analysis will not work until you add one.'}
                </span>
              </label>
              <label className="cu-field">
                <span className="cu-label">Model</span>
                <select
                  className="cu-select"
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                >
                  <option value="gemini-3.5-flash">gemini-3.5-flash (recommended, fast)</option>
                  <option value="gemini-3.8-flash">gemini-3.8-flash (latest)</option>
                  <option value="gemini-2.5-pro">gemini-2.5-pro (most accurate)</option>
                </select>
                <span className="cu-hint">The model used for complexity analysis.</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button className="cu-btn cu-btn-accent cu-btn-sm" type="submit">
                Save API settings
              </button>
              {geminiKey.trim() ? (
                <span className="cu-badge cu-badge-green">Gemini connected</span>
              ) : (
                <span className="cu-badge cu-badge-amber">Not connected</span>
              )}
              {settingsMsg && <span className="cu-success-text">{settingsMsg}</span>}
            </div>
          </form>

          {/* prompt editor */}
          <div className="cu-grid-2" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
            <form className="cu-card cu-card-pad" onSubmit={savePrompt}>
              <h3 style={{ marginTop: 0 }}>Analysis prompt</h3>
              <p className="cu-hint" style={{ marginBottom: 16 }}>
                This template is sent to Gemini for every analysis. Saving bumps its version
                automatically (trigger: trg_prompt_before_update).
              </p>

              <label className="cu-field">
                <span className="cu-label">Prompt name</span>
                <input
                  className="cu-input"
                  value={promptName}
                  onChange={(e) => setPromptName(e.target.value)}
                />
              </label>

              <label className="cu-field">
                <span className="cu-label">Prompt template</span>
                <textarea
                  className="cu-textarea"
                  rows={22}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.6 }}
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  required
                />
              </label>

              {promptMsg && <p className="cu-success-text">{promptMsg}</p>}

              <button className="cu-btn cu-btn-primary" type="submit">
                Save prompt
              </button>
            </form>

            <div>
              <div className="cu-card cu-card-pad">
                <h3 style={{ marginTop: 0 }}>Placeholders</h3>
                <table className="cu-table">
                  <tbody>
                    <tr>
                      <td className="mono">{'{CODE}'}</td>
                      <td>The pasted code (required)</td>
                    </tr>
                    <tr>
                      <td className="mono">{'{LANGUAGE}'}</td>
                      <td>Selected language or auto</td>
                    </tr>
                    <tr>
                      <td className="mono">{'{MODE}'}</td>
                      <td>detailed or short</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="cu-card cu-card-pad" style={{ marginTop: 16 }}>
                <h3 style={{ marginTop: 0 }}>Current version</h3>
                <p>
                  <strong className="mono">v{prompt?.version ?? 1}</strong> — {prompt?.name || 'default'}
                </p>
                <p className="cu-hint">
                  Last updated {prompt?.updated_at || 'never'}
                  {prompt?.updated_by_name ? ` by ${prompt.updated_by_name}` : ''}.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= users ================= */}
      {tab === 'users' && (
        <div className="cu-card" style={{ overflow: 'hidden' }}>
          <div className="cu-table-wrap">
            <table className="cu-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Rank</th>
                  <th>Analyses</th>
                  <th>Bookmarks</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 620 }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <select
                        className="cu-select cu-select-sm"
                        value={u.role}
                        onChange={(e) => patchUser(u.id, { role: e.target.value })}
                        disabled={u.id === user.id}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td>{u.rank_label}</td>
                    <td>{u.analysis_count}</td>
                    <td>{u.saved_topic_count}</td>
                    <td>
                      {u.status === 'suspended' ? (
                        <span className="cu-badge cu-badge-amber">suspended</span>
                      ) : (
                        <span className="cu-badge cu-badge-green">active</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="cu-btn cu-btn-ghost cu-btn-sm"
                          type="button"
                          onClick={() =>
                            patchUser(u.id, { status: u.status === 'suspended' ? 'active' : 'suspended' })
                          }
                          disabled={u.id === user.id}
                        >
                          {u.status === 'suspended' ? 'Restore' : 'Suspend'}
                        </button>
                        <button
                          className="cu-btn cu-btn-danger cu-btn-sm"
                          type="button"
                          onClick={() => deleteUser(u.id)}
                          disabled={u.id === user.id}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
