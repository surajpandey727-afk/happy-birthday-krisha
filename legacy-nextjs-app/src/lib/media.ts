/* Placeholder media resolver.
 * Real assets live under /public and are referenced as "/media/...".
 * Anything that does not start with "/" is treated as a placeholder token
 * (e.g. "YOUR_PHOTO_01") and rendered as an elegant, deterministic gradient.
 * Adding real files means changing the token to a "/media/..." path — no
 * component edits required. */

import { hashSeed } from "@/lib/seededRandom";

const GRADIENTS: [string, string][] = [
  ["#3027a0", "#9b9be0"], // ultramarine → periwinkle
  ["#ef6a9c", "#f6c4d6"], // flamingo → pink-cloud
  ["#fbe6ee", "#f6efe4"], // pink-wash → cream
  ["#5650c2", "#e6e9f4"], // ultramarine-soft → mist
  ["#1d1666", "#5650c2"], // deep ultramarine
  ["#f79bbd", "#fdfaf5"], // flamingo-soft → warm-white
];

export interface PlaceholderMeta {
  label: string;
  tone: "dark" | "light";
  from: string;
  to: string;
  rotation: string;
}

export function isPlaceholder(src: string): boolean {
  return !src.startsWith("/") && !/^https?:\/\//.test(src);
}

export function placeholderMeta(token: string): PlaceholderMeta {
  const h = hashSeed(token);
  const g = GRADIENTS[h % GRADIENTS.length];
  const [from, to] = g;
  // luminance heuristic for readable text tone
  const isLight = from === "#fbe6ee" || to === "#f6efe4" || from === "#f79bbd";
  const label = token.replace(/_/g, " ").toLowerCase();
  const rotation = `${((h >> 4) % 7) - 3}deg`;
  return {
    label,
    tone: isLight ? "light" : "dark",
    from,
    to,
    rotation,
  };
}

/** Deterministic SVG data-URI used for video posters / og images. */
export function gradientSvg(token: string, w = 1600, h = 900, text?: string): string {
  const { from, to } = placeholderMeta(token);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
</linearGradient></defs>
<rect width="100%" height="100%" fill="url(#g)"/>
<circle cx="${w * 0.2}" cy="${h * 0.25}" r="${w * 0.35}" fill="#ffffff" opacity="0.12"/>
<circle cx="${w * 0.85}" cy="${h * 0.8}" r="${w * 0.3}" fill="#ffffff" opacity="0.1"/>
<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
  font-family="Georgia,serif" font-size="${Math.round(w * 0.05)}"
  fill="${from === '#fbe6ee' ? '#3027a0' : '#ffffff'}" opacity="0.85">
  ${text ?? ""}</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}