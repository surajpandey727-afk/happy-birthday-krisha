/**
 * Site + experience copy. Everything personal lives here so the voice can be
 * changed without touching components.
 */

export const SITE = {
  name: "OUR LITTLE WORLD",
  shortName: "i❤kripi",
  tagline: "a little place that belongs only to us.",
  enter: "come in",
  welcomeBack: "welcome back.",
  foundYou: "found you.",
  missingMeAnswer: "good. i'm still here, exactly where you left me.",
  madeUsSmile: "there. that's us.",
  secretTitle: "you found the secret door.",
} as const;

export const NAV = [
  { href: "/home", label: "home", tag: "our room" },
  { href: "/us", label: "us", tag: "a wall of us" },
  { href: "/memories", label: "memories", tag: "remember this?" },
  { href: "/case", label: "the case", tag: "a small investigation" },
  { href: "/doodle", label: "notebook", tag: "paper & pen" },
  { href: "/little-things", label: "little things", tag: "today's little thing" },
] as const;

/** Little handwritten-style notes scattered through the world. */
export const NOTES = [
  { text: "you noticed.", tone: "cheeky" },
  { text: "this one's my favourite.", tone: "soft" },
  { text: "i ❤ kripi", tone: "secret" },
  { text: "still us.", tone: "soft" },
  { text: "look what we did.", tone: "proud" },
  { text: "one more thing…", tone: "playful" },
  { text: "kabhi kabhi mere dil mein khayal aata hai, ke jaise tujhko banaya gaya hai mere liye.", tone: "soft" },
] as const;

/** Notes shown by the "missing me?" interaction. Short, on purpose. */
export const MISSING_ME_NOTES = [
  "hazy morning, feels like a withdrawal symptom.",
  "sit with me for a second.",
  "you're the calm in all of my noise.",
  "close your eyes. i'm exactly where you left me.",
  "i carry us with me everywhere.",
  "a little world, just for two.",
  "you're not a crossing thought in my head. you exist in it, with more grace than i'd like to admit.",
  "i saw a light in the sky and i've been chasing it. i found it in your eyes.",
  "even the barren deserts wait for rain to sprout the smallest cacti buds. i'm the desert. i'm waiting.",
  "saason zara dheere aahiste chalo. teri yaad aayi hai.",
  "the pink sweatshirt is steadily losing your smell. so are my arms.",
  "some silences say more than words could. i'm sitting in one of them right now, thinking of you.",
] as const;

/** Content for "make me smile". Playful on purpose. */
export const SMILE_NOTES = [
  "remember that tiny laugh? i saved it.",
  "you, but funnier.",
  "official notice, you're good at being you.",
  "if a smile is what you wanted, consider it delivered.",
  "are you a bank loan? because you've got my interest, and i'm terrible at paying things back.",
  "the winner takes it all, and i'm so glad i could make you mine.",
  "if you had a twin, i would still choose you.",
  "you bring the warmth. i bring the terrible jokes. balanced diet.",
  "official statement from the department of us: you're doing great, kripi.",
  "one year doesn't feel long. it feels like i've known you forever, and i'd take forever again.",
] as const;

/** Moods used across memories. */
export const MOODS = [
  "golden",
  "gentle",
  "laughing",
  "soft",
  "late-night",
  "home",
] as const;

/** Messages that can label "today's little thing". */
export const DAILY_ACK = [
  "there's a little thing waiting for you.",
  "a little something, just for today.",
  "the world left you a note.",
] as const;