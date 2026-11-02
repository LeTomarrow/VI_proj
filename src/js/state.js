// Shared state of the coordinated views. Every change notifies all subscribers, so an
// interaction in one chart reaches the others.

const dispatch = d3.dispatch("change");

export const state = {
  year: 2024,                // selected year; end of the range in the Range average and Change modes
  rangeStart: 2000,
  metric: "renewableShare",  // key in METRICS (scales.js)
  mode: "year",              // "year" | "average" | "change"
  hovered: null,             // key of the highlighted entity
};

export function setState(patch) {
  Object.assign(state, patch);
  dispatch.call("change", null, state);
}

export function onStateChange(listener) {
  dispatch.on("change", listener);
}
