// Pure helpers of View B's bubble scatter (no DOM), so they can be tested in Node.

import { CONTINENTS } from "./constants.js";

export const scatterComparedCountries = (s) => (s.compared ?? []).filter((key) => !CONTINENTS.includes(key));

// A country can be drawn: positive emissions per person and total emissions, and an intensity.
export const validBubble = (r) => !!r && r.emissionsPerCapita > 0 && r.carbonIntensity !== null && r.emissions > 0;

// Filter "Show": smallest total emissions (Mt), so microstates do not pile up in a corner.
export const MIN_EMISSIONS = [[0, "All"], [1, "≥ 1 Mt"], [10, "≥ 10 Mt"]];
const passesShow = (r, s) => validBubble(r) && r.emissions >= (s.scatterMin ?? 0);
// While comparing, only the compared countries (even below the threshold), plus the brushed
// group if there is a brush (s.brushed, added by main.js).
export function shownAt(r, s) {
  if (!validBubble(r)) return false;
  const compared = scatterComparedCountries(s);
  if (!compared.length) return passesShow(r, s);
  return compared.includes(r.key) || !!s.brushed?.has(r.key);
}

// region: { x: [lo, hi] emissions per person, y: [lo, hi] carbon intensity }, in data units.
export const inRegion = (r, { x, y }) => r.emissionsPerCapita >= x[0] && r.emissionsPerCapita <= x[1]
  && r.carbonIntensity >= y[0] && r.carbonIntensity <= y[1];

// Keys of the countries inside the brush in the selected year (Show filter applies, the comparison
// does not), or null without a brush. An empty brush counts as no brush, so it does not fade every
// chart. The brush is a region in data units, so a country enters or leaves it when the year changes.
export function brushedKeys(keys, byCountry, s) {
  const b = s.brush;
  if (!b || s.level !== "continent" || b.continent !== s.continent) return null;
  const inside = keys.filter((k) => {
    const r = byCountry.get(k)?.get(s.year);
    return passesShow(r, s) && inRegion(r, b);
  });
  return inside.length ? new Set(inside) : null;
}

// One history at a time: only the hovered, visible compared country in Change mode.
export function scatterTrailKeys(keys, s) {
  return s.mode === "change" && s.hovered && scatterComparedCountries(s).includes(s.hovered)
    && keys.includes(s.hovered) ? [s.hovered] : [];
}
