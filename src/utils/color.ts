/**
 * Color helpers for translucent UI layers (pill tints, icon halos).
 *
 * The theme palettes hand us hex strings, so "20% opacity" backgrounds need the
 * alpha channel appended. Anything that is already rgba()/hsla() is returned
 * unchanged rather than mangled.
 */

/** Returns `#RRGGBB` as `#RRGGBBAA` with the given 0–1 alpha; other formats pass through. */
export function withAlpha(color: string, alpha: number): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return color;
  const clamped = Math.max(0, Math.min(1, alpha));
  const byte = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0');
  return `${color}${byte}`;
}
