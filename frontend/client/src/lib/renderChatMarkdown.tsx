import React from "react";

/**
 * Lightweight inline markdown renderer for ESANG chat messages.
 * Supports: **bold**, line breaks, list items (- item), and emoji.
 * No dangerouslySetInnerHTML — returns React elements.
 */
export function renderChatMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Convert **bold** to <strong>
    const parts: React.ReactNode[] = [];
    const boldRegex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }
      parts.push(<strong key={`b-${i}-${match.index}`}>{match[1]}</strong>);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }
    if (parts.length === 0) parts.push(line);

    // Wrap list items
    const trimmed = line.trimStart();
    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      elements.push(
        <div key={`line-${i}`} className="flex gap-1.5 ml-1">
          <span className="opacity-50 flex-shrink-0">•</span>
          <span>{parts.length === 1 && typeof parts[0] === "string" ? parts[0].replace(/^[-•]\s*/, "") : parts}</span>
        </div>
      );
    } else if (trimmed === "") {
      elements.push(<div key={`line-${i}`} className="h-1.5" />);
    } else {
      elements.push(
        <span key={`line-${i}`}>
          {parts}
          {i < lines.length - 1 && <br />}
        </span>
      );
    }
  }

  return <>{elements}</>;
}
