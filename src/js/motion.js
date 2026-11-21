// Shared motion: one duration and one easing for every chart. Marks move only when the data they
// show changes (year, range, metric, ranking, level, comparison, brush group), never on hover, so
// hovering stays instant. Durations drop to 0 for users who ask for reduced motion.

export const DURATION = 500;
const EASE = d3.easeCubicOut;
const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)");

// True when the user asks for reduced motion (checked when called, so a change applies).
export const prefersReducedMotion = () => !!reduced?.matches;

// Draws a line in from its start, then removes the dash so later redraws are plain lines.
export function drawLineIn(path, ms) {
  const length = path.node().getTotalLength();
  path.attr("stroke-dasharray", `${length} ${length}`).attr("stroke-dashoffset", length)
    .transition().duration(ms).ease(d3.easeCubicInOut).attr("stroke-dashoffset", 0)
    .on("end", () => path.attr("stroke-dasharray", null));
}

// What makes marks move. main.js sets s.animate when this key changes between two renders.
export function motionKey(s) {
  return JSON.stringify([s.year, s.rangeStart, s.mode, s.metric, s.level, s.continent, s.compared,
    s.mekkoRank, s.mekkoSort, s.mekkoTop, s.mekkoCompared, s.barsTop, s.barsSort, s.scatterMin, s.profileRef, s.brushed ? [...s.brushed].sort() : null]);
}

export function moves(s) {
  return !!s?.animate && !prefersReducedMotion();
}

// The selection itself (instant) or a transition of it, for the attributes that encode data.
// Without motion, a running transition is stopped so the new values are not overwritten.
export function tween(selection, s, duration = DURATION) {
  if (!moves(s)) return selection.interrupt();
  return selection.transition().duration(duration).ease(EASE);
}
