import type { ReactNode } from "react";

type NoteBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

const BULLET = /^\s*[-*•]\s+(.*)$/;
const MD_LINK = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi;
const BARE_URL = /(https?:\/\/[^\s<>()\[\]"]+)/gi;

function safeHttpUrl(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Split text into plain + link nodes (markdown [text](url) + bare https URLs). */
export function linkifyNoteText(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  const mdMatches = Array.from(text.matchAll(MD_LINK));
  type Span = { start: number; end: number; label: string; href: string };
  const spans: Span[] = [];

  for (const match of mdMatches) {
    const href = safeHttpUrl(match[2] ?? "");
    if (!href || match.index == null) continue;
    spans.push({
      start: match.index,
      end: match.index + match[0].length,
      label: match[1] ?? href,
      href,
    });
  }

  // Fill gaps with bare-URL detection (skip ranges already covered by markdown)
  function pushPlain(chunk: string) {
    if (!chunk) return;
    let local = 0;
    const bare = Array.from(chunk.matchAll(BARE_URL));
    for (const match of bare) {
      const href = safeHttpUrl(match[1] ?? "");
      const index = match.index ?? 0;
      if (index > local) {
        nodes.push(chunk.slice(local, index));
      }
      if (href) {
        nodes.push(
          <a
            key={`a-${key++}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {match[1]}
          </a>
        );
      } else {
        nodes.push(match[0]);
      }
      local = index + match[0].length;
    }
    if (local < chunk.length) nodes.push(chunk.slice(local));
  }

  for (const span of spans) {
    if (span.start > cursor) pushPlain(text.slice(cursor, span.start));
    nodes.push(
      <a
        key={`a-${key++}`}
        href={span.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {span.label}
      </a>
    );
    cursor = span.end;
  }
  if (cursor < text.length) pushPlain(text.slice(cursor));

  return nodes.length > 0 ? nodes : [text];
}

export function parseProductNote(raw: string): NoteBlock[] {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const blocks: NoteBlock[] = [];
  let para: string[] = [];
  let bullets: string[] = [];

  function flushPara() {
    const text = para.join("\n").trimEnd();
    if (text.trim()) blocks.push({ type: "p", text });
    para = [];
  }

  function flushBullets() {
    if (bullets.length) blocks.push({ type: "ul", items: bullets });
    bullets = [];
  }

  for (const line of lines) {
    const match = line.match(BULLET);
    if (match) {
      flushPara();
      bullets.push(match[1] ?? "");
      continue;
    }
    if (line.trim() === "") {
      flushPara();
      flushBullets();
      continue;
    }
    flushBullets();
    para.push(line);
  }
  flushPara();
  flushBullets();
  return blocks;
}

/** First non-empty line, for cards / compact lists. */
export function productNotePreview(raw: string | null | undefined): string {
  if (!raw) return "";
  return (
    raw
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line) =>
        line
          .replace(/^\s*[-*•]\s+/, "")
          .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi, "$1")
          .trim()
      )
      .find((line) => line) ?? ""
  );
}

type ProductNoteProps = {
  text: string;
  className?: string;
};

export function ProductNote({ text, className }: ProductNoteProps) {
  const blocks = parseProductNote(text);
  if (blocks.length === 0) return null;

  return (
    <div className={className}>
      {blocks.map((block, i) =>
        block.type === "p" ? (
          <p key={i}>{linkifyNoteText(block.text)}</p>
        ) : (
          <ul key={i}>
            {block.items.map((item, j) => (
              <li key={j}>{linkifyNoteText(item)}</li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
