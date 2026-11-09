// Metric definitions and colours shared by the charts. Colour rules are in
// docs/iteration2/01-integration-plan.md (decision log).

export const NO_DATA = "#d9d8d2";

// domain: fixed across years, so a colour change always means a change in the data.
// changeMax: limit of the symmetric Change scale. cleanerIs: direction of a cleaner grid.
// darker: what a darker colour means, for the map's reading line.
export const METRICS = {
  renewableShare: {
    label: "Renewable share", unit: "%", changeUnit: " pp", digits: 1,
    darker: "more of the electricity is renewable",
    domain: [0, 100], changeMax: 30, cleanerIs: 1, ramp: d3.interpolateGreens,
  },
  fossilShare: {
    label: "Fossil share", unit: "%", changeUnit: " pp", digits: 1,
    darker: "more of the electricity comes from fossil fuels",
    domain: [0, 100], changeMax: 30, cleanerIs: -1, ramp: d3.interpolateOranges,
  },
  carbonIntensity: {
    label: "Carbon intensity", unit: " gCO₂/kWh", changeUnit: " gCO₂/kWh", digits: 0,
    darker: "more CO₂ per kWh generated",
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

// Bottom to top in the Marimekko, fossil first. Bioenergy and other renewables are one colour
// (the chart has 8 series at most); the tooltip gives both parts. Validated as a stack with the
// dataviz palette script.
export const SOURCE_GROUPS = [
  { key: "coal", label: "Coal", color: "#845008", parts: ["coal"] },
  { key: "oil", label: "Oil", color: "#e8504f", parts: ["oil"] },
  { key: "gas", label: "Gas", color: "#f0932b", parts: ["gas"] },
  { key: "nuclear", label: "Nuclear", color: "#c9a0e8", parts: ["nuclear"] },
  { key: "hydro", label: "Hydro", color: "#1c5cab", parts: ["hydro"] },
  { key: "wind", label: "Wind", color: "#2bb3d9", parts: ["wind"] },
  { key: "solar", label: "Solar", color: "#d9a900", parts: ["solar"] },
  { key: "bioOther", label: "Bioenergy & other", color: "#3f9142", parts: ["bioenergy", "otherRenewable"] },
];

// One fixed colour per continent: emissions bands and comparison chips. Validated for the
// adjacency of the emissions stack.
export const CONTINENT_COLORS = {
  Asia: "#2a78d6",
  "North America": "#eb6834",
  Europe: "#1baf7a",
  Africa: "#eda100",
  "South America": "#e87ba4",
  Oceania: "#008300",
};

export const SOURCE_LABELS ={ bioenergy: "Bioenergy", otherRenewable: "Other renewables" };

// Country identity colours are independent of source and map metric colours.
export const COUNTRY_COMPARE_COLORS = ["#1c5cab", "#b34700", "#7b4291", "#087f6d"];
