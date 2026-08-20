'use client';
import { useEffect, useRef } from 'react';
import { sanitizeHtml } from '@/lib/sanitizeHtml';

const COMMANDS: { cmd: string; label: string; arg?: string }[] = [
  { cmd: 'bold', label: 'B' },
  { cmd: 'italic', label: 'I' },
  { cmd: 'underline', label: 'U' },
  { cmd: 'formatBlock', label: 'H', arg: 'h2' },
  { cmd: 'insertUnorderedList', label: '•' },
  { cmd: 'insertOrderedList', label: '1.' },
];

/** A lightweight contentEditable rich-text editor — bold/italic/underline,
 * one heading level, and lists. No editor library is installed in this
 * project; execCommand covers this small a surface without adding one,
 * and everything is sanitized (src/lib/sanitizeHtml.ts) before it leaves
 * this component. */
export function RichTextEditor({
  html,
  onChange,
  placeholder = 'start writing…',
}: {
  html: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // null (not `html`) so the effect's first run after mount always syncs —
  // a contentEditable div has no declarative children, so skipping the
  // initial write (the previous version did, whenever the incoming `html`
  // prop happened to already equal what a fresh ref was seeded with) left
  // the div empty even though real content existed, e.g. right after
  // NotebookShell remounts this component by toggling write/draw mode.
  const lastSyncedHtml = useRef<string | null>(null);

  // Only overwrite the live DOM when `html` changed for a reason OTHER than
  // our own onInput (e.g. switching to a different note) — otherwise every
  // keystroke would reset the cursor to the start.
  useEffect(() => {
    if (ref.current && html !== lastSyncedHtml.current && document.activeElement !== ref.current) {
      ref.current.innerHTML = html;
      lastSyncedHtml.current = html;
    }
  }, [html]);

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    handleInput();
  };

  const handleInput = () => {
    if (!ref.current) return;
    const clean = sanitizeHtml(ref.current.innerHTML);
    lastSyncedHtml.current = clean;
    onChange(clean);
  };

  return (
    <div className="rounded-2xl border border-brown-warm/30 bg-surface/60">
      <div className="flex flex-wrap gap-1 border-b border-brown-warm/30 p-2">
        {COMMANDS.map((c) => (
          <button
            key={c.cmd + (c.arg ?? '')}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec(c.cmd, c.arg)}
            className="font-magnode flex h-8 w-8 items-center justify-center rounded-lg text-sm text-parchment transition-colors hover:bg-royal-vivid/15 hover:text-royal-vivid"
            aria-label={c.cmd}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className="notebook-editable min-h-[40vh] px-4 py-4 text-[15px] leading-relaxed text-parchment outline-none [&_h2]:font-magnode [&_h2]:mt-3 [&_h2]:text-xl [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
      />
    </div>
  );
}
