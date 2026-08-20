/* Shared content + app types. Kept small and deliberately plain so anyone can
 * add content without understanding components. */

export type MediaKind = "image" | "video" | "audio";

export interface Media {
  /** real path under /public (e.g. "/media/photos/01.jpg") OR a placeholder token
   *  like "YOUR_PHOTO_01". Placeholder tokens render as elegant gradients. */
  src: string;
  thumb?: string;
  kind?: MediaKind;
  w?: number;
  h?: number;
  alt?: string;
  caption?: string;
  mood?: string;
}

export interface Memory {
  id: string;
  title?: string;
  date?: string;
  location?: string;
  description?: string;
  photos?: Media[];
  videos?: Media[];
  audio?: Media[];
  note?: string;
  tags?: string[];
  mood?: string;
  hidden?: boolean;
  /** pinned memories are emphasised on the memory wall */
  pinned?: boolean;
}

export interface EasterEggDef {
  id: string;
  /** human / wearable message. may include "❤" which renders specially */
  message: string;
  trigger:
    | { type: "level_complete"; probability?: number }
    | { type: "page"; page: string; probability?: number }
    | { type: "taps"; taps: number; probability?: number }
    | { type: "random"; probability?: number }
    | { type: "back_home"; probability?: number }
    | { type: "rare"; probability?: number };
  /** optional cooldown in ms before this egg can appear again */
  cooldown?: number;
  destination?: string;
}

export interface ProgressInfo {
  unlocked: number;
  completed: number;
  bestMoves?: number;
  lastLevel: number;
  seenLevels: number;
}