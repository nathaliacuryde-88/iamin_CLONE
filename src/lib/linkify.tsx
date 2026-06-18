import type { ReactNode } from "react";

const URL_RE = /(https?:\/\/[^\s]+)/g;

/**
 * Split text into React children, wrapping URLs in anchor tags that
 * wrap inside their container instead of expanding it.
 */
export function linkifyText(text: string): ReactNode[] {
  if (!text) return [];
  const parts = text.split(URL_RE);
  return parts.map((part, i) => {
    if (URL_RE.test(part)) {
      // Reset regex state because of /g flag
      URL_RE.lastIndex = 0;
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    URL_RE.lastIndex = 0;
    return <span key={i}>{part}</span>;
  });
}
