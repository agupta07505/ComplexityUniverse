'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      router.push(data.user.role === 'admin' ? '/admin' : '/dashboard');
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
          <span className="cu-eyebrow">Welcome back</span>
          <h1 className="cu-display">
            Pick up where your
            <br />
            code left off.
          </h1>
          <p>
            Your saved analyses, bookmarked topics and reading notes are waiting in your
            dashboard.
          </p>
          <ul className={styles.authPoints}>
            <li>Full history of every analysis you save</li>
            <li>Bookmarked Learn topics in one place</li>
            <li>Profile and reading activity</li>
          </ul>
        </div>

        <div className={styles.authCard}>
          <h2>Sign in</h2>
          <p className={styles.authSub}>Use your ComplexityUniverse account</p>

          <form onSubmit={submit}>
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
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            {error && <p className="cu-error-text">{error}</p>}

            <button className="cu-btn cu-btn-primary cu-btn-block" type="submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className={styles.authAlt}>
            New here? <Link href="/register">Create an account</Link>
          </p>

          <div className={styles.authAdmin}>
            Administrator? <Link href="/admin">Open the admin console →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
