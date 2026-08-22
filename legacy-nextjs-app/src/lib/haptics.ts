/** Vibration helper with graceful fallback. Never rely on it. */

export function haptic(pattern: number | number[] = 12) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    /* unsupported — ignore */
  }
}

export const haptics = {
  tap: () => haptic(8),
  success: () => haptic([20, 40, 30]),
  error: () => haptic([30]),
  chain: () => haptic(10),
};