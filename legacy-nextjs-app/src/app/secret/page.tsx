'use client';
import { useEffect, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { MEMORY_DB } from '@content/memories';
import { pushToast } from '@/lib/eggBus';
import { sound } from '@/lib/sounds';
import { markSecretDoorFound } from '@/lib/secretDoor';
import SpecularButton from '@/components/reactbits/SpecularButton';

/** The secret room — found through curiosity, never advertised. Finding it
 * (lighting the whole constellation) is what unlocks "the case" elsewhere. */
export default function SecretRoomPage() {
  const router = useRouter();
  const secrets = MEMORY_DB.filter((m) => m.hidden);
  const [lit, setLit] = useState(0);
  const [revealed, setRevealed] = useState(false);

  // Reveal fires from an effect watching `lit`, not inline in the click
  // handler off `lit + 1` — rapid taps (very plausible here, it's an
  // excited "find the secret" moment) can fire before a re-render lands,
  // and reading `lit` directly from the closure would undercount every tap
  // in that window. The functional update below stays pure (no side
  // effects inside it, safe under StrictMode's double-invoke), and the
  // effect is what actually triggers the one-time reveal.
  const tapStar = () => {
    sound.pop();
    setLit((prev) => prev + 1);
  };

  useEffect(() => {
    if (lit >= 3 && !revealed) {
      setRevealed(true);
      sound.success();
      pushToast('i ❤ kripi');
      markSecretDoorFound();
    }
  }, [lit, revealed]);

  return (
    <main
      className="safe-top min-h-dvh pb-32 safe-bottom"
      style={{
        background:
          'radial-gradient(120% 120% at 50% 0%, color-mix(in srgb, var(--color-royal-deep) 55%, transparent), color-mix(in srgb, var(--color-void) 70%, transparent))',
      }}
    >
      <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
        <p className="fade-in font-nebulica text-[10px] uppercase tracking-[0.5em] text-royal-vivid/80">
          you found the secret door
        </p>

        {/* constellation — the actual tap targets that unlock everything
            past this page, so their entrance can't risk being the one
            place a stuck framer-motion mount animation leaves something
            permanently invisible. Plain @keyframes, staggered via
            --fade-delay, playing from the moment each button exists. */}
        <div className="font-apestron mt-8 flex items-center gap-6">
          {['i', '❤', 'k', 'r', 'i', 'p', 'i'].map((ch, i) => (
            <button
              key={i}
              aria-label={ch === '❤' ? 'heart' : `letter ${ch}`}
              onClick={tapStar}
              className={`pop-in flex h-12 w-10 items-center justify-center text-3xl transition-colors duration-500 sm:text-5xl ${
                i === 1 ? 'text-royal-vivid' : 'text-parchment/80'
              } ${lit >= i ? '' : 'opacity-60'}`}
              style={
                {
                  textShadow: lit > 0 ? '0 0 18px color-mix(in srgb, var(--color-royal-vivid) 60%, transparent)' : 'none',
                  '--fade-delay': `${0.4 + i * 0.15}s`,
                } as CSSProperties
              }
            >
              {ch}
            </button>
          ))}
        </div>

        <p
          className="font-monigue mt-8 text-lg italic text-muted"
          style={{ opacity: revealed ? 1 : 0, transitionProperty: 'opacity', transitionDuration: '1000ms' } as CSSProperties}
        >
          a little phrase, just for us. it shows up all over this place, if you know where to look.
        </p>

        {/* hidden memories live here */}
        <div className="mt-12 flex w-full flex-col gap-3">
          {secrets.map((m, i) => (
            <button
              key={m.id}
              onClick={() => {
                sound.tap();
                pushToast(m.note ?? 'this one stays between us.');
              }}
              className="fade-in-up font-monigue rounded-2xl border border-dashed border-royal-vivid/40 bg-white/[0.03] px-5 py-4 text-lg italic text-parchment transition-colors hover:border-royal-vivid hover:bg-white/[0.06]"
              style={{ '--fade-delay': `${i * 0.15}s` } as CSSProperties}
            >
              {m.title}
            </button>
          ))}
        </div>

        <p
          className="fade-in font-nebulica mt-12 text-[10px] uppercase tracking-[0.4em] text-muted-dim/60"
          style={{ '--fade-delay': '1s' } as CSSProperties}
        >
          some doors only open for the curious.
        </p>

        {revealed && (
          <div className="fade-in-up mt-14 flex w-full flex-col items-center gap-6 border-t border-royal-vivid/20 pt-10">
            <p className="font-monigue max-w-sm text-base italic text-muted">
              You went looking for a door that wasn't on any map. That's the part of you I'd follow anywhere.
            </p>
            <p className="font-monigue max-w-sm text-sm italic text-muted-dim">
              ishq par zor nahin hai, ye woh aatish, ghalib, ke lagaaye na lage aur bujhaaye na bane.
            </p>
            <SpecularButton
              size="md"
              onClick={() => {
                sound.tap();
                router.push('/case');
              }}
              baseColor="#111f52"
              lineColor="#efe4d0"
            >
              there's a case waiting now
            </SpecularButton>
          </div>
        )}
      </div>
    </main>
  );
}
