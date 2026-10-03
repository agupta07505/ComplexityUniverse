import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="cu-footer">
      <div className="cu-wrap cu-footer-grid">
        <div className="cu-footer-col" style={{ maxWidth: 300 }}>
          <span className="cu-logo" style={{ fontSize: 15 }}>
            <span>
              Complexity<span className="lo-2">Universe</span>
            </span>
          </span>
          <span>
            Understand what your code costs — before your users do. Time &amp; space complexity
            analysis with a growing library of algorithm notes.
          </span>
        </div>
        <div className="cu-footer-col">
          <strong>Product</strong>
          <Link href="/">Analyzer</Link>
          <Link href="/learn">Learn</Link>
          <Link href="/how-to-use">How to use</Link>
        </div>
        <div className="cu-footer-col">
          <strong>Account</strong>
          <Link href="/login">Sign in</Link>
          <Link href="/register">Create account</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>
        <div className="cu-footer-col">
          <strong>Built with</strong>
          <span>Next.js App Router</span>
          <span>MySQL — CRUD Operations, views & triggers</span>
          <span>AI-assisted static analysis</span>
        </div>
      </div>
    </footer>
  );
}
