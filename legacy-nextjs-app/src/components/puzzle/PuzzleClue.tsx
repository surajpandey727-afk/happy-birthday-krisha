/** An "evidence card" reveal — clue text framed like a case-file annotation.
 * Plain CSS @keyframes (see `.pop-in`-adjacent `clueIn` in globals.css), not
 * framer-motion — this is the confirmation that a puzzle answer was
 * correct, so it can't risk sitting at opacity:0 after mounting. */
export function PuzzleClue({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="clue-in relative rounded-xl border border-royal-vivid/40 bg-brown-deep/30 px-5 py-4">
      <span className="absolute -top-2.5 left-4 bg-surface-alt px-2 font-nebulica text-[9px] uppercase tracking-[0.35em] text-royal-vivid">
        {label}
      </span>
      <p className="font-monigue text-lg italic leading-relaxed text-parchment">{children}</p>
    </div>
  );
}
