// Pure helpers of View B's bubble scatter (no DOM), so they can be tested in Node.

import { CONTINENTS } from "./constants.js";

export const scatterComparedCountries = (s) => (s.compared ?? []).filter((key) => !CONTINENTS.includes(key));

// A country can be drawn: positive emissions per person and total emissions, and an intensity.
export const validBubble = (r) => !!r && r.emissionsPerCapita > 0 && r.carbonIntensity !== null && r.emissions > 0;

// Filter "Show": smallest total emissions (Mt), so microstates do not pile up in a corner.
export const MIN_EMISSIONS = [[0, "All"], [1, "≥ 1 Mt"], [10, "≥ 10 Mt"]];
export function shownAt(r, s) {
  if (!validBubble(r)) return false;
  const compared = scatterComparedCountries(s);
  // Selected countries remain visible even below the normal emissions threshold.
  return compared.length ? compared.includes(r.key) : r.emissions >= (s.scatterMin ?? 0);
}

// region: { x: [lo, hi] emissions per person, y: [lo, hi] carbon intensity }, in data units.
export const inRegion = (r, { x, y }) => r.emissionsPerCapita >= x[0] && r.emissionsPerCapita <= x[1]
  && r.carbonIntensity >= y[0] && r.carbonIntensity <= y[1];

// Keys of the shown countries inside the brush in the selected year, or null without a brush.
// The brush is a region in data units, so a country enters or leaves it when the year changes.
export function brushedKeys(keys, byCountry, s) {
  const b = s.brush;
  if (!b || s.level !== "continent" || b.continent !== s.continent) return null;
  return new Set(keys.filter((k) => {
    const r = byCountry.get(k)?.get(s.year);
    return shownAt(r, s) && inRegion(r, b);
  }));
}
