'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { MEMORY_DB } from '@content/memories';
import { pushToast } from '@/lib/eggBus';
import { sound } from '@/lib/sounds';

/** The secret room — found through curiosity, never advertised. */
export default function SecretRoomPage() {
  const secrets = MEMORY_DB.filter((m) => m.hidden);
  const [lit, setLit] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const tapStar = () => {
    sound.pop();
    const n = lit + 1;
    setLit(n);
    if (n >= 3 && !revealed) {
      setRevealed(true);
      sound.success();
      pushToast('i ❤ kripi');
    }
  };

  return (
    <main className="safe-top min-h-dvh bg-[radial-gradient(120%_120%_at_50%_0%,var(--color-royal-deep),var(--color-void))] pb-32 safe-bottom">
      <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
        <motion.p
          className="font-nebulica text-[10px] uppercase tracking-[0.5em] text-royal-vivid/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          you found the secret door
        </motion.p>

        {/* constellation */}
        <motion.div
          className="font-apestron mt-8 flex items-center gap-6"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.5, delayChildren: 0.4 } } }}
        >
          {['i', '❤', 'k', 'r', 'i', 'p', 'i'].map((ch, i) => (
            <motion.button
              key={i}
              aria-label={ch === '❤' ? 'heart' : `letter ${ch}`}
              onClick={tapStar}
              variants={{
                hidden: { opacity: 0, scale: 0, rotate: -12 },
                show: { opacity: 1, scale: 1, rotate: 0 },
              }}
              transition={{ type: 'spring', stiffness: 200, damping: 16 }}
              className={`flex h-12 w-10 items-center justify-center text-3xl transition-colors duration-500 sm:text-5xl ${
                i === 1 ? 'text-royal-vivid' : 'text-parchment/80'
              } ${lit >= i ? '' : 'opacity-60'}`}
              style={{ textShadow: lit > 0 ? '0 0 18px color-mix(in srgb, var(--color-royal-vivid) 60%, transparent)' : 'none' }}
            >
              {ch}
            </motion.button>
          ))}
        </motion.div>

        <motion.p
          className="font-monigue mt-8 text-lg italic text-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: revealed ? 1 : 0 }}
          transition={{ duration: 1 }}
        >
          a little phrase, just for us — it shows up all over this place.
        </motion.p>

        {/* hidden memories live here */}
        <div className="mt-12 flex w-full flex-col gap-3">
          {secrets.map((m, i) => (
            <motion.button
              key={m.id}
              onClick={() => {
                sound.tap();
                pushToast(m.note ?? 'this one stays between us.');
              }}
              className="font-monigue rounded-2xl border border-dashed border-royal-vivid/40 bg-white/[0.03] px-5 py-4 text-lg italic text-parchment transition-colors hover:border-royal-vivid hover:bg-white/[0.06]"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
            >
              {m.title}
            </motion.button>
          ))}
        </div>

        <motion.p
          className="font-nebulica mt-12 text-[10px] uppercase tracking-[0.4em] text-muted-dim/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          some doors only open for the curious.
        </motion.p>
      </div>
    </main>
  );
}
