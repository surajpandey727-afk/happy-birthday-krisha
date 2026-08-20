'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { AnimatePresence, motion } from 'framer-motion';
import { spotifyConfig } from '@/config/spotify';
import { sound } from '@/lib/sounds';

/** Spotify's public IFrame API — https://developer.spotify.com/documentation/embeds/references/iframe-api
 * Minimal shape for what this component actually uses. */
interface SpotifyEmbedController {
  togglePlay: () => void;
  addListener: (event: string, cb: (e: { data: PlaybackUpdate }) => void) => void;
  destroy: () => void;
}
interface PlaybackUpdate {
  isPaused: boolean;
  isBuffering: boolean;
  duration: number;
  position: number;
}
interface SpotifyIframeApi {
  createController: (
    element: HTMLElement,
    options: { uri: string; width?: string | number; height?: string | number },
    callback: (controller: SpotifyEmbedController) => void
  ) => void;
}

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIframeApi) => void;
  }
}

/**
 * A floating music-orb control, not a stock Spotify button. Idle: a small
 * spinning-vinyl orb. Hover: "play our soundtrack" reveals. Click: expands
 * a panel holding Spotify's own compact embed (play/pause, track title,
 * artist, art, and progress all come from Spotify's real embed UI — the
 * public IFrame API doesn't expose track metadata or next/prev to the host
 * page, only play state, so faking a richer custom UI would mean showing
 * data we don't actually have). Our own play/pause + the orb's spin state
 * are wired to the real controller via the 'playback_update' event.
 *
 * Autoplay is never assumed: the embed script only loads, and the
 * controller only calls play, in direct response to a click.
 */
export function FloatingSpotifyPlayer() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [scriptRequested, setScriptRequested] = useState(false);
  const [playback, setPlayback] = useState<PlaybackUpdate | null>(null);

  const embedHostRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SpotifyEmbedController | null>(null);
  const apiRef = useRef<SpotifyIframeApi | null>(null);

  const createController = useCallback(() => {
    if (!apiRef.current || !embedHostRef.current || controllerRef.current || !spotifyConfig.playlistUri) return;
    apiRef.current.createController(
      embedHostRef.current,
      { uri: spotifyConfig.playlistUri, width: '100%', height: 152 },
      (controller) => {
        controllerRef.current = controller;
        controller.addListener('playback_update', (e) => setPlayback(e.data));
      }
    );
  }, []);

  useEffect(() => {
    window.onSpotifyIframeApiReady = (api) => {
      apiRef.current = api;
      createController();
    };
    return () => {
      delete window.onSpotifyIframeApiReady;
    };
  }, [createController]);

  const open = () => {
    sound.tap();
    setExpanded(true);
    if (spotifyConfig.configured) setScriptRequested(true);
  };

  const isPlaying = playback ? !playback.isPaused : false;
  const progressPct = playback && playback.duration > 0 ? (playback.position / playback.duration) * 100 : 0;

  if (pathname === '/') return null;

  return (
    <div
      className="fixed bottom-[max(env(safe-area-inset-bottom),1.25rem)] right-4 z-30 flex flex-col items-end gap-3 sm:right-6"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="w-72 overflow-hidden rounded-2xl border border-royal/40 bg-surface/95 shadow-luxe backdrop-blur"
          >
            <div className="flex items-center justify-between px-4 pt-3">
              <p className="font-nebulica text-[10px] uppercase tracking-[0.35em] text-royal-vivid">our soundtrack</p>
              <button
                aria-label="collapse player"
                onClick={() => setExpanded(false)}
                className="tap-target -mr-2 text-muted transition-colors hover:text-parchment"
              >
                ✕
              </button>
            </div>

            {!spotifyConfig.configured ? (
              <div className="px-4 pb-4 pt-2">
                <p className="font-monigue text-sm italic text-muted">
                  no playlist configured yet — set NEXT_PUBLIC_SPOTIFY_PLAYLIST_URI to wire this in.
                </p>
              </div>
            ) : (
              <>
                <div className="px-3 pt-2" ref={embedHostRef} />
                {scriptRequested && (
                  <Script
                    src="https://open.spotify.com/embed/iframe-api/v1"
                    strategy="afterInteractive"
                  />
                )}
                <div className="flex items-center gap-3 px-4 pb-4 pt-1">
                  <button
                    aria-label={isPlaying ? 'pause' : 'play'}
                    onClick={() => controllerRef.current?.togglePlay()}
                    className="tap-target rounded-full bg-royal-vivid/20 text-royal-vivid transition-colors hover:bg-royal-vivid/30"
                  >
                    {isPlaying ? '⏸' : '▶'}
                  </button>
                  <div className="h-[2px] flex-1 overflow-hidden rounded-full bg-brown/60">
                    <div
                      className="h-full bg-royal-vivid transition-[width] duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <a
                    href={spotifyConfig.openUrl ?? undefined}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-nebulica shrink-0 text-[9px] uppercase tracking-[0.25em] text-muted transition-colors hover:text-royal-vivid"
                  >
                    open ↗
                  </a>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        <AnimatePresence>
          {hovering && !expanded && (
            <motion.p
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              className="font-monigue absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-full bg-surface/95 px-3 py-1.5 text-xs italic text-parchment shadow-luxe"
            >
              play our soundtrack
            </motion.p>
          )}
        </AnimatePresence>

        <button
          aria-label={expanded ? 'soundtrack player open' : 'play our soundtrack'}
          onClick={open}
          className="tap-target relative flex h-14 w-14 items-center justify-center rounded-full bg-surface shadow-luxe ring-1 ring-royal-vivid/40"
        >
          <span
            className="absolute inset-0 rounded-full opacity-60"
            style={{ background: 'radial-gradient(circle at 50% 50%, rgba(40,71,158,0.35), transparent 70%)' }}
          />
          <svg
            viewBox="0 0 48 48"
            className={`h-9 w-9 text-royal-vivid ${isPlaying ? 'animate-vinyl' : ''}`}
            aria-hidden="true"
          >
            <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.9" />
            <circle cx="24" cy="24" r="14" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            <circle cx="24" cy="24" r="8" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.35" />
            <circle cx="24" cy="24" r="3.5" fill="currentColor" />
            <circle cx="24" cy="24" r="1.2" fill="var(--color-surface)" />
          </svg>
        </button>
      </div>
    </div>
  );
}
