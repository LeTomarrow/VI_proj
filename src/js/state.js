// Shared state of the coordinated views. Every change notifies all subscribers, so an
// interaction in one chart reaches the others.

import { CONTINENTS, YEARS } from "./data/constants.js";
import { EMISSIONS_STACK } from "./scales.js";

const dispatch = d3.dispatch("change");

// Countries or continents: 5 at most (= View B's Top 5 and the 5 compare colours).
export const MAX_COMPARED = 5;

export const state = {
  year: 2024,                // selected year; end of the range in Change mode
  rangeStart: 2000,
  metric: "renewableShare",  // key in METRICS (scales.js)
  mode: "year",              // "year" | "change"
  hovered: null,             // key of the highlighted entity
  level: "world",            // "world" | "continent" | "compare" (View C)
  compareFrom: "world",      // level to return to when leaving View C
  continent: null,           // continent shown at the continent level
  compared: [],              // keys in the comparison list, in the order they were added
  brush: null,               // scatter brush: { continent, x: [lo, hi], y: [lo, hi] } in data units
  mekkoRank: "generation",   // mix chart (A and B): key in RANKS (scales.js) that orders the columns
  mekkoSort: "desc",         // mix chart: "desc" (largest first) | "asc"
  barsSort: "desc",          // View B sorted bars: "desc" (largest gain first) | "asc"
  scatterMin: 0,             // View B scatter: smallest total emissions shown (Mt): 0 | 1 | 10
  profileRef: "world",       // View C radars: reference polygon, "none" | "world" | "continent"
  mekkoTop: 10,              // View B mix chart: 5 or 10 = the ranked top N (bars + mix)
  mekkoCompared: true,       // View B mix chart: with 2+ compared countries, show only them (bars + mix)
  barsTop: 10,               // View B sorted bars: 10 = the largest gains (or the brushed group) | "all"
};

export function setState(patch) {
  Object.assign(state, patch);
  dispatch.call("change", null, state);
}

export function onStateChange(listener) {
  dispatch.on("change", listener);
}

// While the comparison list is not empty, the other entities move to the background in charts
// whose colour is categorical (never on the map, where a lighter colour means a lower value).
// The hovered entity is always shown in full. shown: keys drawn in the chart, so a compared
// country does not fade a chart of continents.
export function isDimmed(key, s, shown) {
  return shown.some((k) => s.compared.includes(k)) && !s.compared.includes(key) && key !== s.hovered;
}

// Outside the scatter brush, while there is one (s.brushed: Set of keys, added by main.js).
// keys: the countries of a mark; a summed column is inside if any of its countries is.
export function isOutsideBrush(keys, s) {
  return !!s.brushed && !keys.some((k) => s.brushed.has(k) || k === s.hovered);
}

// View A's emissions chart: the compared continents, in stack order.
export function comparedContinents(s) {
  return EMISSIONS_STACK.filter((k) => s.compared.includes(k));
}

export function comparisonType(key) {
  return CONTINENTS.includes(key) ? "continents" : "countries";
}

// Colour slot (0-4) of a compared country. A country keeps its slot while it stays in the list,
// so removing one never repaints the others; a new country takes the lowest free slot.
const slots = new Map();
export function comparedSlot(key) {
  for (const k of slots.keys()) if (!state.compared.includes(k)) slots.delete(k);
  for (const k of state.compared) {
    if (slots.has(k)) continue;
    const used = new Set(slots.values());
    slots.set(k, d3.range(MAX_COMPARED).find((i) => !used.has(i)));
  }
  return slots.get(key);
}

export function toggleCompared(key) {
  if (state.compared.includes(key)) setState({ compared: state.compared.filter((k) => k !== key) });
  else addCompared([key]);
}

// Adds keys of one type (the first key's), in the given order, up to the limit; keeps the ones of
// that type already in the list and drops the other type. Returns the keys added. Reaching two or
// more compared countries switches View B's mix chart to the compared countries only.
export function addCompared(keys) {
  if (!keys.length) return [];
  const type = comparisonType(keys[0]);
  const sameType = state.compared.filter((k) => comparisonType(k) === type);
  const free = Math.max(0, MAX_COMPARED - sameType.length);
  const added = keys.filter((k) => comparisonType(k) === type && !sameType.includes(k)).slice(0, free);
  if (!added.length) return added;
  const second = type === "countries" && sameType.length < 2 && sameType.length + added.length >= 2;
  setState({ compared: [...sameType, ...added], ...(second ? { mekkoCompared: true } : {}) });
  return added;
}

// The comparison belongs to a level: World compares continents, a continent compares its
// countries. Changing level drops what the new level cannot show; View C keeps the list.
export function scopeCompared(compared, level, continent, continentOf) {
  if (level === "world") return compared.filter((k) => comparisonType(k) === "continents");
  if (level === "continent") return compared.filter((k) => comparisonType(k) === "countries" && continentOf(k) === continent);
  return compared;
}

let continentOfKey = () => null;
export function setContinentLookup(lookup) { continentOfKey = lookup; }

export function goToLevel(patch) {
  const level = patch.level ?? state.level;
  const continent = patch.continent === undefined ? state.continent : patch.continent;
  setState({ ...patch, compared: scopeCompared(state.compared, level, continent, continentOfKey), hovered: null });
}

// View C keeps the comparison list; leaving it returns to the level it was opened from.
export function openCompare() {
  if (!state.compared.length || state.level === "compare") return;
  // The rows read "since rangeStart", so the year must come after it.
  const rangeStart = Math.max(YEARS[0], Math.min(state.rangeStart, state.year - 1));
  const start = state.year > state.rangeStart ? {} : { rangeStart, year: Math.max(state.year, rangeStart + 1) };
  setState({ level: "compare", compareFrom: state.level, hovered: null, ...start });
}

export function closeCompare() {
  setState({ level: state.compareFrom, hovered: null });
}
