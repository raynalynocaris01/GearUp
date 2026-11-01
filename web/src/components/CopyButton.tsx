'use client';

import { useState } from 'react';

interface Props {
  text: string;
  label?: string;
  className?: string;
}

export function CopyButton({ text, label = 'Copy', className = '' }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied — silently no-op.
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={className}
    >
      {copied ? 'Copied!' : label}
    </button>
  );
}