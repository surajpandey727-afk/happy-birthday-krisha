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
    <main className="safe-top min-h-dvh bg-[radial-gradient(120%_120%_at_50%_0%,#1d1666,#0f0b34)] pb-32 safe-bottom">
      <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
        <motion.p
          className="text-[11px] uppercase tracking-[0.5em] text-pink-cloud/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          you found the secret door
        </motion.p>

        {/* constellation */}
        <motion.div
          className="mt-8 flex items-center gap-6 font-display"
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
              className={`flex h-12 w-10 items-center justify-center text-3xl sm:text-5xl transition-colors duration-500 ${
                i === 1 ? 'text-flamingo' : 'text-warm-white/80'
              } ${lit > 0 ? 'text-shadow' : ''} ${lit >= i ? '' : 'opacity-60'}`}
              style={{ textShadow: lit > 0 ? '0 0 18px rgba(239,106,156,0.6)' : 'none' }}
            >
              {ch}
            </motion.button>
          ))}
        </motion.div>

        <motion.p
          className="mt-8 font-hand text-2xl text-pink-cloud"
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
              className="rounded-2xl border border-dashed border-pink-cloud/50 bg-white/5 px-5 py-4 font-hand text-2xl text-pink-cloud hover:border-flamingo hover:bg-white/10 transition-colors"
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
          className="mt-12 text-[10px] uppercase tracking-[0.4em] text-warm-white/30"
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