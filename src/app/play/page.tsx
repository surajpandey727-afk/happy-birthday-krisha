'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { WorldShell } from '@/components/world/WorldShell';
import { makeProgressStore } from '@/games/framework/progress';
import { sound } from '@/lib/sounds';

const GAMES = [
  {
    id: 'liquid',
    href: '/play/liquid',
    title: 'liquid love',
    blurb: 'pour until every glass holds one colour.',
    icon: (
      <svg viewBox="0 0 48 48" className="h-10 w-10"><path d="M18 8 h12 v26 a4 4 0 0 1 -12 0 z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/><circle cx="24" cy="24" r="5" fill="currentColor" opacity="0.8"/></svg>
    ),
  },
  {
    id: 'untangle',
    href: '/play/untangle',
    title: 'untangle',
    blurb: 'pull the knots out — no lines may cross.',
    icon: (
      <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 14 h24 M18 34 l14 -20 M34 34 L14 14" /></svg>
    ),
  },
  {
    id: 'arrows',
    href: '/play/arrows',
    title: 'arrow // chain',
    blurb: 'start the chain. predict the cascade.',
    icon: (
      <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 24 l20 0 m-6 -7 l7 7 -7 7" /></svg>
    ),
  },
] as const;

function ProgressPips({ store }: { store: ReturnType<typeof makeProgressStore> }) {
  const [, tick] = useState(0);
  useEffect(() => store.subscribe(() => tick((t) => t + 1)), [store]);
  const p = store.load();
  const hearts = Math.min(10, Math.round((p.completed.length / 100) * 10));
  return (
    <div className="flex items-center gap-0.5" aria-label={`${p.completed.length} levels solved`}>
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} className={`text-sm ${i < hearts ? 'text-flamingo' : 'text-pink-cloud/50'}`}>
          ❤
        </span>
      ))}
    </div>
  );
}

const PROGRESS = {
  liquid: makeProgressStore('liquid'),
  untangle: makeProgressStore('untangle'),
  arrows: makeProgressStore('arrows'),
};

export default function PlayPage() {
  return (
    <WorldShell kicker="the games table" title="play" blurb="a little table with three old friends.">
      <div className="grid gap-4 sm:grid-cols-3">
        {GAMES.map((g, i) => {
          return (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href={g.href}
                onClick={() => sound.tap()}
                className="group flex h-full flex-col items-center gap-3 rounded-3xl bg-warm-white p-6 text-center text-ink shadow-soft ring-1 ring-pink-cloud/30 transition-all hover:-translate-y-1.5 hover:shadow-card"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-wash text-ultramarine transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  {g.icon}
                </span>
                <h2 className="font-display text-2xl">{g.title}</h2>
                <p className="font-hand text-lg text-ink-soft">{g.blurb}</p>
                <ProgressPips store={PROGRESS[g.id]} />
                <span className="mt-auto font-hand text-xl text-flamingo">come play →</span>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <p className="mt-8 text-center font-hand text-xl text-ink-soft">
        every puzzle solved is a memory tucked into our little world.
      </p>
    </WorldShell>
  );
}