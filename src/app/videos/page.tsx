'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { WorldShell } from '@/components/world/WorldShell';
import { VIDEO_DB } from '@content/videos';
import { PlaceholderFigure } from '@/components/media/MediaFigure';
import { VideoPlayer } from '@/components/media/VideoPlayer';
import { sound } from '@/lib/sounds';
import type { VideoItem } from '@/lib/types';

export default function VideosPage() {
  const [open, setOpen] = useState<VideoItem | null>(null);

  return (
    <WorldShell kicker="the screen" title="videos" blurb="the moments that move.">
      <div className="grid gap-4 sm:grid-cols-2">
        {VIDEO_DB.map((v, i) => (
          <motion.button
            key={v.id}
            onClick={() => {
              sound.tap();
              setOpen(v);
            }}
            className="group relative overflow-hidden rounded-3xl bg-warm-white text-left shadow-soft ring-1 ring-pink-cloud/30 transition-all hover:-translate-y-1 hover:shadow-card"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, delay: (i % 2) * 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative aspect-video overflow-hidden">
              <PlaceholderFigure token={v.thumb ?? v.file} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-warm-white/85 text-ultramarine shadow-soft transition-transform duration-300 group-hover:scale-110">
                  ▶
                </span>
              </span>
              <span className="absolute bottom-2 right-2 rounded-md bg-ultramarine-deep/70 px-2 py-0.5 text-xs text-warm-white">
                {v.duration}
              </span>
            </div>
            <div className="p-4">
              <h2 className="font-display text-2xl text-ink">{v.title}</h2>
              <p className="mt-0.5 font-hand text-lg text-ink-soft">
                {v.note} {v.date ? `· ${v.date}` : ''}
              </p>
            </div>
          </motion.button>
        ))}
      </div>

      {open && (
        <VideoPlayer
          file={open.file}
          thumb={open.thumb}
          title={open.title}
          note={open.note}
          onClose={() => setOpen(null)}
        />
      )}
    </WorldShell>
  );
}