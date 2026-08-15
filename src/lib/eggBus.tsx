/** Tiny event bus for ephemeral toasts (Easter eggs, little messages). */
type Listener = (msg: string, id?: string) => void;

const listeners = new Set<Listener>();

export function pushToast(msg: string, id?: string) {
  listeners.forEach((fn) => fn(msg, id));
}

export function onToast(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Render a message, turning the heart token into a styled heart glyph. */
export function renderHeartWords(msg: string) {
  return msg.split('❤').map((part, i, arr) => (
    <span key={i}>
      {part}
      {i < arr.length - 1 && (
        <span className="mx-0.5 inline-block text-flamingo" aria-hidden>
          ❤
        </span>
      )}
    </span>
  ));
}