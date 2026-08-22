import type { EasterEggDef } from "@/lib/types";

export type { EasterEggDef };

/**
 * The Easter Egg Engine content. Each egg has a trigger + probability so some
 * are common, some rare, some very rare. Discovered eggs are tracked locally.
 * `message` may contain "❤" — rendered as a soft heart mark.
 */
export const EASTER_EGGS: EasterEggDef[] = [
  {
    id: "egg-home-hidden",
    message: "you found it. i❤kripi",
    trigger: { type: "taps", taps: 7, probability: 1 },
    cooldown: 60_000 * 8,
  },
  {
    id: "egg-level",
    message: "i ❤ kripi",
    trigger: { type: "level_complete", probability: 0.12 },
    cooldown: 60_000 * 3,
  },
  {
    id: "egg-photo",
    message: "found you.",
    trigger: { type: "random", probability: 0.08 },
    cooldown: 60_000 * 8,
  },
  {
    id: "egg-back",
    message: "welcome back.",
    trigger: { type: "back_home", probability: 1 },
    cooldown: 60_000 * 30,
  },
  {
    id: "egg-rare",
    message: "i\'m still right here. i ❤ kripi",
    trigger: { type: "rare", probability: 0.04 },
    cooldown: 60_000 * 60,
  },
] as const;

export const EGG_DB = EASTER_EGGS as EasterEggDef[];