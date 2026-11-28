// Pure helpers of View B's bubble scatter (no DOM), so they can be tested in Node.

import { CONTINENTS } from "./constants.js";

export const scatterComparedCountries = (s) => (s.compared ?? []).filter((key) => !CONTINENTS.includes(key));

// A country can be drawn: positive emissions per person and total emissions, and an intensity.
export const validBubble = (r) => !!r && r.emissionsPerCapita > 0 && r.carbonIntensity !== null && r.emissions > 0;

// Filter "Show": smallest total emissions (Mt), so microstates do not pile up in a corner.
export const MIN_EMISSIONS = [[0, "All"], [1, "≥ 1 Mt"], [10, "≥ 10 Mt"]];
const passesShow = (r, s) => validBubble(r) && r.emissions >= (s.scatterMin ?? 0);
// Eligibility is independent of the brush so resizing it can bring countries back.
function eligibleAt(r, s) {
  if (!validBubble(r)) return false;
  const compared = scatterComparedCountries(s);
  return compared.length ? compared.includes(r.key) : passesShow(r, s);
}

// Outside-brush bubbles remain visible for context; the chart fades them after the drag.
export function shownAt(r, s) {
  return eligibleAt(r, s);
}

// region: { x: [lo, hi] emissions per person, y: [lo, hi] carbon intensity }, in data units.
export const inRegion = (r, { x, y }) => r.emissionsPerCapita >= x[0] && r.emissionsPerCapita <= x[1]
  && r.carbonIntensity >= y[0] && r.carbonIntensity <= y[1];

// Brush eligible countries independently of which bubbles the previous box displayed.
// Empty comparisons stay empty while a box is active; without comparison, empty brushes are ignored.
export function brushedKeys(keys, byCountry, s) {
  const b = s.brush;
  if (!b || s.level !== "continent" || b.continent !== s.continent) return null;
  const inside = keys.filter((k) => {
    const r = byCountry.get(k)?.get(s.year);
    return eligibleAt(r, s) && inRegion(r, b);
  });
  return inside.length || scatterComparedCountries(s).length ? new Set(inside) : null;
}

// One history at a time: only the hovered, visible compared country in Change mode.
export function scatterTrailKeys(keys, s) {
  return s.mode === "change" && s.hovered && scatterComparedCountries(s).includes(s.hovered)
    && keys.includes(s.hovered) ? [s.hovered] : [];
}
