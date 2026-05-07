/**
 * useHaptics — Kinetic Feedback System
 *
 * Wraps the Web Vibration API with semantically named patterns.
 * All calls are no-ops on unsupported devices (desktop, iOS Safari).
 *
 * Pattern rationale:
 *   keypress  → 8ms    subtle confirmation, doesn't interrupt flow
 *   setDone   → burst  mirrors the physical "plate settling" sensation
 *   pr        → [40,60,40,60,80]  two heavy impacts = plate-clang (PR milestone)
 *
 * Uses requestAnimationFrame so vibration scheduling doesn't block
 * any pending paint frames from React's commit phase.
 */

function fire(pattern: number | number[]) {
  requestAnimationFrame(() => {
    try { navigator.vibrate(pattern) } catch (_) { /* unsupported — silent */ }
  })
}

export interface HapticController {
  /** Light tap — regular key press or toggle */
  keypress: () => void
  /** Short burst — set marked complete (not a PR) */
  setDone:  () => void
  /** Double heavy impact — Personal Record achieved */
  pr:       () => void
  /** Abort / destructive action */
  abort:    () => void
}

export function useHaptics(): HapticController {
  return {
    keypress: () => fire(8),
    setDone:  () => fire([15, 8, 30]),
    pr:       () => fire([40, 60, 40, 60, 80]),   // plate-clang pattern
    abort:    () => fire([30, 20, 30]),
  }
}
