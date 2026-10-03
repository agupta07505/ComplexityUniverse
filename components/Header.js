'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV_MENU_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/learn', label: 'Learn' },
  { href: '/how-to-use', label: 'How to use' },
  { href: '/dashboard', label: 'Dashboard', requiresAuth: true },
];

export default function Header() {
  const [currentUser, setCurrentUser] = useState(null);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let isSubscribed = true;
    fetch('/api/auth/me')
      .then((response) => response.json())
      .then((data) => isSubscribed && setCurrentUser(data.user))
      .catch(() => {})
      .finally(() => isSubscribed && setHasCheckedAuth(true));
    return () => {
      isSubscribed = false;
    };
  }, [pathname]);

  // Close mobile navigation on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    setIsMobileMenuOpen(false);
    router.push('/');
    router.refresh();
  }

  const userInitials = (currentUser?.name || '')
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  return (
    <header className="site-header">
      <div className="cu-wrap header-container">
        <Link href="/" className="brand-logo" onClick={() => setIsMobileMenuOpen(false)}>
          <span>
            Complexity<span className="accent-word">Universe</span>
          </span>
        </Link>

        {/* Mobile Navigation Toggle Button */}
        <button
          type="button"
          className="mobile-nav-toggle"
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        >
          {isMobileMenuOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          )}
        </button>

        <nav className={`nav-links ${isMobileMenuOpen ? 'is-open' : ''}`}>
          {NAV_MENU_ITEMS.filter((item) => !item.requiresAuth || currentUser).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? 'is-active' : ''}
            >
              {item.label}
            </Link>
          ))}

          {hasCheckedAuth && !currentUser && (
            <span className="user-nav-actions">
              <Link href="/login" className="cu-btn cu-btn-ghost cu-btn-sm">
                Sign in
              </Link>
              <Link href="/register" className="cu-btn cu-btn-primary cu-btn-sm">
                Get started
              </Link>
            </span>
          )}

          {currentUser && (
            <span className="user-nav-actions">
              {currentUser.role === 'admin' && (
                <Link href="/admin" className="cu-badge cu-badge-accent" title="Admin console">
                  Admin
                </Link>
              )}
              <span className="user-avatar" title={currentUser.name}>
                {userInitials || 'U'}
              </span>
              <button type="button" className="cu-btn cu-btn-ghost cu-btn-sm" onClick={handleSignOut}>
                Sign out
              </button>
            </span>
          )}
        </nav>
      </div>
    </header>
  );
}
