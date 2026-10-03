'use client';

import { useState } from 'react';

export default function CodeBlock({ code, language = 'code' }) {
  const [hasCopied, setHasCopied] = useState(false);

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 1600);
    } catch {
      // Fallback if clipboard API is restricted
    }
  }

  return (
    <div className="code-container">
      <div className="code-bar">
        <span>{language}</span>
        <button
          type="button"
          className="copy-button"
          onClick={handleCopyCode}
        >
          {hasCopied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}
