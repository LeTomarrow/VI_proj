// Shared state of the coordinated views. Every change notifies all subscribers, so an
// interaction in one chart reaches the others.

import { CONTINENTS } from "./data/constants.js";

const dispatch = d3.dispatch("change");

export const MAX_COMPARED = 5;

export const state = {
  year: 2024,                // selected year; end of the range in the Range average and Change modes
  rangeStart: 2000,
  metric: "renewableShare",  // key in METRICS (scales.js)
  mode: "year",              // "year" | "average" | "change"
  hovered: null,             // key of the highlighted entity
  level: "world",            // "world" | "continent"
  continent: null,           // continent shown at the continent level
  compared: [],              // keys in the comparison list, in the order they were added
  brush: null,               // scatter brush: { continent, x: [lo, hi], y: [lo, hi] } in data units
  mekkoRank: "generation",   // View B mix chart: key in RANKS (scales.js) that orders the countries
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

export function comparisonType(key) {
  return CONTINENTS.includes(key) ? "continents" : "countries";
}

// Colour slot (0–4) of a compared country. A country keeps its slot while it stays in the list,
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
  const { compared } = state;
  if (compared.includes(key)) setState({ compared: compared.filter((k) => k !== key) });
  else {
    const sameType = compared.filter((k) => comparisonType(k) === comparisonType(key));
    if (sameType.length >= MAX_COMPARED) return;
    // A second compared country switches View B's mix chart to the compared countries only.
    const second = comparisonType(key) === "countries" && sameType.length === 1;
    setState({ compared: [...sameType, key], ...(second ? { mekkoCompared: true } : {}) });
  }
}
