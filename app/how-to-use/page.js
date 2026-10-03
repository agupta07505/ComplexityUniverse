import Link from 'next/link';
import ComplexityBadge from '@/components/ComplexityBadge';
import styles from './page.module.css';

export const metadata = {
  title: 'How to use — ComplexityUniverse',
};

export default function HowToUsePage() {
  return (
    <div>
      <section className={styles.howHero}>
        <div className="cu-wrap">
          <span className="cu-eyebrow">How to use</span>
          <h1>Four moves, and the whole
            <br />
            universe is yours.</h1>
          <p>
            ComplexityUniverse is built around one loop: paste code, understand the cost, save
            what matters, and grow your intuition with the Learn library.
          </p>
        </div>
      </section>

      <div className="cu-wrap cu-page">
        {/* steps */}
        <div className="cu-section-head">
          <h2 className="cu-display" style={{ fontSize: 26 }}>Step by step</h2>
        </div>
        <div className={styles.steps}>
          <div className={styles.step}>
            <h3>Paste your code</h3>
            <p>
              On the home page, drop any function, class or script into the editor. Pick the
              language (or leave it on auto-detect) and choose <strong>Detailed</strong> for a
              full breakdown or <strong>Short</strong> for the verdict only.
            </p>
          </div>
          <div className={styles.step}>
            <h3>Press Analyze</h3>
            <p>
              The button sits right under the editor. Results appear beneath it: time and space
              complexity badges, best/average/worst cases, where the cost comes from,
              bottlenecks and optimization ideas.
            </p>
          </div>
          <div className={styles.step}>
            <h3>Save to your dashboard</h3>
            <p>
              Signed in? Hit “Save to dashboard” and the code, its analysis and the engine used
              are kept in your history. Everything is listed newest-first with quick detail
              views.
            </p>
          </div>
          <div className={styles.step}>
            <h3>Learn and bookmark</h3>
            <p>
              The Learn page is a structured library — topics on the left, notes and worked
              code on the right. Press “Save topic” on anything you want to revise; it lands in
              your dashboard under Saved topics.
            </p>
          </div>
        </div>

        <hr className="cu-divider" style={{ margin: '48px 0' }} />

        {/* legend */}
        <div className="cu-section-head">
          <h2 className="cu-display" style={{ fontSize: 26 }}>Reading the badges</h2>
          <p style={{ color: 'var(--ink-2)' }}>
            Every complexity is colour-coded so you can judge a result at a glance.
          </p>
        </div>
        <div className="cu-card cu-card-pad">
          <div className={styles.howLegend}>
            <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center' }}>
              <ComplexityBadge label="Time" value="O(1)" /> <span className="cu-hint">excellent — constant</span>
            </span>
            <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center' }}>
              <ComplexityBadge label="Time" value="O(log n)" /> <span className="cu-hint">excellent — halving</span>
            </span>
            <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center' }}>
              <ComplexityBadge label="Time" value="O(n)" /> <span className="cu-hint">good — linear</span>
            </span>
            <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center' }}>
              <ComplexityBadge label="Time" value="O(n log n)" /> <span className="cu-hint">good — sorting class</span>
            </span>
            <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center' }}>
              <ComplexityBadge label="Time" value="O(n^2)" /> <span className="cu-hint">heavy — nested loops</span>
            </span>
            <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center' }}>
              <ComplexityBadge label="Time" value="O(2^n)" /> <span className="cu-hint">severe — exponential</span>
            </span>
          </div>
        </div>

        <hr className="cu-divider" style={{ margin: '48px 0' }} />

        {/* faq */}
        <div className="cu-section-head">
          <h2 className="cu-display" style={{ fontSize: 26 }}>Questions people ask</h2>
        </div>
        <div className={styles.faq}>
          <details>
            <summary>Do I need an account to analyze code?</summary>
            <p>
              No — analysis works instantly for everyone. An account is only needed to save
              analyses, bookmark Learn topics and keep a profile.
            </p>
          </details>
          <details>
            <summary>Where do the results come from?</summary>
            <p>
              Results are produced by Google Gemini, using a prompt template the admin can
              edit from the admin console. The admin also adds the Gemini API key there
              (AI settings tab) — the key is stored safely in the MySQL database.
            </p>
          </details>
          <details>
            <summary>What does “confidence” mean?</summary>
            <p>
              It reflects how certain the engine is about the classification. Short, clear
              loops score high; ambiguous or unusual control flow scores lower — treat those
              results as guidance and reason about them.
            </p>
          </details>
          <details>
            <summary>Can I run this locally?</summary>
            <p>
              Yes. It is a standard Next.js app backed by MySQL — clone it, run
              <code> npm run db:setup</code>, then <code>npm run dev</code>. The README walks
              through every step, including database features used (views, triggers, cascade
              rules and procedures).
            </p>
          </details>
          <details>
            <summary>What is the admin console for?</summary>
            <p>
              Admins manage the Learn library (topics and code examples), set the Gemini API
              key and model, edit the AI prompt used for analysis, and manage users. It is
              linked directly from the sign-in page.
            </p>
          </details>
        </div>

        <div className="cu-note" style={{ marginTop: 36 }}>
          Ready? <Link href="/">Paste your first snippet</Link> or <Link href="/learn">open the Learn library</Link>.
        </div>
      </div>
    </div>
  );
}
