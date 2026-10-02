'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from './Logo';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/learn', label: 'Learn' },
  { href: '/how-to-use', label: 'How to use' },
  { href: '/dashboard', label: 'Dashboard', auth: true },
];

export default function Header() {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => alive && setUser(d.user))
      .catch(() => {})
      .finally(() => alive && setChecked(true));
    return () => {
      alive = false;
    };
  }, [pathname]);

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setMenuOpen(false);
    router.push('/');
    router.refresh();
  }

  const initials = (user?.name || '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <header className="cu-header">
      <div className="cu-wrap cu-header-in">
        <Link href="/" className="cu-logo" onClick={() => setMenuOpen(false)}>
          <Logo />
          <span>
            Complexity<span className="lo-2">Universe</span>
          </span>
        </Link>

        <nav className="cu-nav">
          {LINKS.filter((l) => !l.auth || user).map((l) => (
            <Link key={l.href} href={l.href} className={pathname === l.href ? 'is-active' : ''}>
              {l.label}
            </Link>
          ))}

          {checked && !user && (
            <span className="cu-nav-user">
              <Link href="/login" className="cu-btn cu-btn-ghost cu-btn-sm">
                Sign in
              </Link>
              <Link href="/register" className="cu-btn cu-btn-primary cu-btn-sm">
                Get started
              </Link>
            </span>
          )}

          {user && (
            <span className="cu-nav-user">
              {user.role === 'admin' && (
                <Link href="/admin" className="cu-badge cu-badge-accent" title="Admin console">
                  Admin
                </Link>
              )}
              <span className="cu-avatar" title={user.name}>
                {initials || 'U'}
              </span>
              <button type="button" className="cu-btn cu-btn-ghost cu-btn-sm" onClick={signOut}>
                Sign out
              </button>
            </span>
          )}
        </nav>
      </div>
    </header>
  );
}
