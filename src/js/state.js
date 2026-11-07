// Shared state of the coordinated views. Every change notifies all subscribers, so an
// interaction in one chart reaches the others.

const dispatch = d3.dispatch("change");

export const MAX_COMPARED = 4;

export const state = {
  year: 2024,                // selected year; end of the range in the Range average and Change modes
  rangeStart: 2000,
  metric: "renewableShare",  // key in METRICS (scales.js)
  mode: "year",              // "year" | "average" | "change"
  hovered: null,             // key of the highlighted entity
  level: "world",            // "world" | "continent"
  continent: null,           // continent shown at the continent level
  compared: [],              // keys in the comparison list, in the order they were added
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
// The hovered entity is always shown in full.
export function isDimmed(key, s = state) {
  return s.compared.length > 0 && !s.compared.includes(key) && key !== s.hovered;
}

export function toggleCompared(key) {
  const { compared } = state;
  if (compared.includes(key)) setState({ compared: compared.filter((k) => k !== key) });
  else if (compared.length < MAX_COMPARED) setState({ compared: [...compared, key] });
}
