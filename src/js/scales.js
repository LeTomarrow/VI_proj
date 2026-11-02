// Metric definitions and colours shared by the charts. Colour rules are in
// docs/iteration2/01-integration-plan.md (decision log).

export const NO_DATA = "#d9d8d2";

// domain: fixed across years, so a colour change always means a change in the data.
// changeMax: limit of the symmetric Change scale. cleanerIs: direction of a cleaner grid.
export const METRICS = {
  renewableShare: {
    label: "Renewable share", unit: "%", changeUnit: " pp", digits: 1,
    domain: [0, 100], changeMax: 30, cleanerIs: 1, ramp: d3.interpolateGreens,
  },
  fossilShare: {
    label: "Fossil share", unit: "%", changeUnit: " pp", digits: 1,
    domain: [0, 100], changeMax: 30, cleanerIs: -1, ramp: d3.interpolateOranges,
  },
  carbonIntensity: {
    label: "Carbon intensity", unit: " gCO₂/kWh", changeUnit: " gCO₂/kWh", digits: 0,
    domain: [0, 800], changeMax: 250, cleanerIs: -1, ramp: d3.interpolateOranges,
  },
};

export const MODES = { year: "Year", average: "Range average", change: "Change" };

export function metricDomain(metric, mode) {
  const { domain, changeMax } = METRICS[metric];
  return mode === "change" ? [-changeMax, changeMax] : domain;
}

// Sequential: one hue, starting above the near-white end of the ramp so that low values stay
// visible on the page. Change: blue is always cleaner, so it does not rely on red/green.
export function metricColor(metric, mode) {
  const { ramp, cleanerIs } = METRICS[metric];
  const [lo, hi] = metricDomain(metric, mode);
  const t = d3.scaleLinear().domain([lo, hi]).range([0, 1]).clamp(true);
  if (mode === "change") return (v) => d3.interpolateRdBu(cleanerIs > 0 ? t(v) : 1 - t(v));
  return (v) => ramp(0.15 + 0.85 * t(v));
}

export function formatMetric(metric, mode, value) {
  const { unit, changeUnit, digits } = METRICS[metric];
  if (mode === "change") return `${d3.format(`+.${digits}f`)(value)}${changeUnit}`;
  return `${d3.format(`.${digits}f`)(value)}${unit}`;
}
