import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="cu-wrap footer-content-grid">
        <div className="footer-links-column">
          <strong>ComplexityUniverse</strong>
          <span style={{ maxWidth: 280, color: 'var(--ink-2)' }}>
            Measure the growth of your code. Time &amp; space complexity, decoded with rigor.
          </span>
          <span style={{ fontSize: 12.5 }}>© {new Date().getFullYear()} ComplexityUniverse</span>
        </div>

        <div className="footer-links-column">
          <strong>Explore</strong>
          <Link href="/">Analyzer</Link>
          <Link href="/learn">Learn library</Link>
          <Link href="/how-to-use">How to use</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>

        <div className="footer-links-column">
          <strong>Engine &amp; DB</strong>
          <span>Aiven Cloud MySQL 8</span>
          <span>Google Gemini 1.5</span>
          <span>Next.js App Router</span>
        </div>

        <div className="footer-links-column">
          <strong>Account</strong>
          <Link href="/login">Sign in</Link>
          <Link href="/register">Create account</Link>
        </div>
      </div>
    </footer>
  );
}
