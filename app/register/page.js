'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className={styles.auth}>
      <div className={`cu-wrap ${styles.authGrid}`}>
        <div className={styles.authCopy}>
          <span className="cu-eyebrow">Create your space</span>
          <h1 className="cu-display">
            Every analysis,
            <br />
            kept in orbit.
          </h1>
          <p>
            Save the code you analyze, build a personal library of complexity topics and track
            how your programs grow.
          </p>
          <ul className={styles.authPoints}>
            <li>Unlimited saved analyses with full detail</li>
            <li>One-click topic bookmarks from the Learn page</li>
            <li>Free, no credit card, no clutter</li>
          </ul>
        </div>

        <div className={styles.authCard}>
          <h2>Create account</h2>
          <p className={styles.authSub}>Takes less than a minute</p>

          <form onSubmit={submit}>
            <label className="cu-field">
              <span className="cu-label">Name</span>
              <input
                className="cu-input"
                type="text"
                autoComplete="name"
                placeholder="Ada Lovelace"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <label className="cu-field">
              <span className="cu-label">Email</span>
              <input
                className="cu-input"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="cu-field">
              <span className="cu-label">Password</span>
              <input
                className="cu-input"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </label>

            {error && <p className="cu-error-text">{error}</p>}

            <button className="cu-btn cu-btn-primary cu-btn-block" type="submit" disabled={busy}>
              {busy ? 'Creating…' : 'Create account'}
            </button>
          </form>

          <p className={styles.authAlt}>
            Already registered? <Link href="/login">Sign in</Link>
          </p>

          <div className={styles.authAdmin}>
            Administrator? <Link href="/admin">Open the admin console →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
