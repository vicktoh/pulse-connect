/**
 * Motion helpers for the handful of gestures that cannot be expressed as a CSS
 * class.
 *
 * Everything else in this system lives in globals.css. What lands here are the
 * one-shot animations that must be *re-triggerable* on demand: a CSS class
 * cannot replay without a remount, and remounting a form field to shake it
 * would throw away the caret. The Web Animations API replays cleanly.
 *
 * The global `prefers-reduced-motion` block in globals.css does not reach
 * WAAPI, so each helper checks the query itself.
 */

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

/**
 * Two beats and done. Enough to move the eye to a field that failed validation,
 * far short of the shake-and-flash pattern that reads as scolding — the error
 * copy in this form is already written to sound like help, not like a rebuke.
 */
export function nudge(element: HTMLElement | null) {
  if (!element || prefersReducedMotion()) return
  element.animate(
    [
      { transform: "translate3d(0, 0, 0)" },
      { transform: "translate3d(-3px, 0, 0)", offset: 0.3 },
      { transform: "translate3d(2px, 0, 0)", offset: 0.65 },
      { transform: "translate3d(0, 0, 0)" },
    ],
    { duration: 220, easing: "cubic-bezier(0.25, 1, 0.5, 1)" }
  )
}

/**
 * Cap on how far a staggered entrance is allowed to run. A feed of forty
 * accounts must not take two seconds to finish arriving, so the offset stops
 * climbing after the first handful and everything past it enters together.
 */
export const STAGGER_CAP = 6

export function staggerIndex(index: number) {
  return Math.min(index, STAGGER_CAP)
}
