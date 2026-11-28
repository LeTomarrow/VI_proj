// Metric definitions and colours shared by the charts. Map metrics: the three sides of the
// paradox, clean share (renewable), outcome (CO₂e per kWh) and size (electricity per person).
// Fossil share was dropped: it is 100 − low-carbon share and r = 0.93 with carbon intensity. Colour rules are in
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
  carbonIntensity: {
    label: "Carbon intensity", unit: " gCO₂e/kWh", changeUnit: " gCO₂e/kWh", digits: 0,
    darker: "more CO₂e per kWh generated",
    domain: [0, 800], changeMax: 250, cleanerIs: -1, ramp: d3.interpolateOranges,
  },
  // The third side of the paradox: how much electricity. Neither cleaner nor dirtier, so its
  // Change scale is a neutral diverging pair (orange = less, purple = more), not blue/red.
  generationPerCapita: {
    label: "Electricity per person", unit: " kWh", changeUnit: " kWh", digits: 0,
    darker: "more electricity generated per person",
    domain: [0, 12000], changeMax: 3000, cleanerIs: 0, ramp: d3.interpolatePurples,
  },
};

export const MODES = { year: "Year", change: "Change" };

// What each unit means, shown on hover where a unit is named (axis titles, column heads).
export const UNITS = {
  pp: "Percentage points: from 20% to 30% is +10 pp (not +50%).",
  "%": "Share of the electricity generated.",
  "gCO₂e/kWh": "Grams of CO₂ equivalent per kWh generated: how dirty the electricity is.",
  "CO₂e": "CO₂ equivalent: other greenhouse gases counted as the CO₂ with the same warming effect.",
  t: "Tonnes of CO₂e from electricity per person in a year.",
  TWh: "Terawatt-hours: one TWh is a billion kWh.",
  "kWh/person": "Electricity generated per person in a year.",
  "MtCO₂e": "Million tonnes of CO₂ equivalent.",
  log: "Log scale: each step to the right multiplies by 10, so small and large countries fit together.",
};

// HTML: a unit with its meaning on hover.
export const unitHtml = (key, label = key) => `<abbr class="unit" title="${UNITS[key]}">${label}</abbr>`;

// SVG: writes a text from parts; a part [label, key] is a unit with its meaning on hover.
export function svgUnitText(text, parts) {
  text.text(null);
  for (const part of parts) {
    const [label, key] = Array.isArray(part) ? part : [part, null];
    const span = text.append("tspan").text(label);
    if (key) span.attr("class", "unit").append("title").text(UNITS[key]);
  }
  return text;
}

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
  if (mode === "change" && !cleanerIs) return (v) => d3.interpolatePuOr(t(v));
  if (mode === "change") return (v) => d3.interpolateRdBu(cleanerIs > 0 ? t(v) : 1 - t(v));
  return (v) => ramp(0.15 + 0.85 * t(v));
}

export function formatMetric(metric, mode, value) {
  const { unit, changeUnit, digits } = METRICS[metric];
  if (mode === "change") return `${d3.format(`+,.${digits}f`)(value)}${changeUnit}`;
  return `${d3.format(`,.${digits}f`)(value)}${unit}`;
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

// Stack order of the emissions area (largest emitters at the bottom); the continent colours are
// validated for it. Colour follows the continent and never changes.
export const EMISSIONS_STACK = ["Asia", "North America", "Europe", "Africa", "South America", "Oceania"];

// What View B's Marimekko ranks the countries by. groups: the source groups that move to the
// base of each column; name: for titles. The ranked value is in TWh.
const sourceTwh = (group) => (r) => d3.sum(group.parts, (k) => r.sources[k]);
export const RANKS = [
  { key: "generation", label: "Total generation", name: "total generation", groups: [], value: (r) => r.generation },
  { key: "lowCarbon", label: "Low-carbon", name: "low-carbon generation",
    groups: ["nuclear", "hydro", "wind", "solar", "bioOther"], value: (r) => r.lowCarbon },
  { key: "fossil", label: "Fossil", name: "fossil generation",
    groups: ["coal", "oil", "gas"], value: (r) => r.fossil },
  ...SOURCE_GROUPS.map((g) => ({
    key: g.key, label: g.label, name: `${g.label.toLowerCase()} generation`, groups: [g.key], color: g.color, value: sourceTwh(g),
  })),
];

// Stack order with the ranked groups at the base, so their shares share one baseline.
export function sourceOrder(rank) {
  return [...SOURCE_GROUPS.filter((g) => rank.groups.includes(g.key)),
    ...SOURCE_GROUPS.filter((g) => !rank.groups.includes(g.key))];
}

export const SOURCE_LABELS ={ bioenergy: "Bioenergy", otherRenewable: "Other renewables" };

// Identity of compared countries (chips, View C). Validated all-pairs for colour blindness
// (worst CVD ΔE 10.7) and kept off the source colours (nearest: coal, ΔE 8.5; the fifth, blue,
// is ΔE 11.8 from hydro and wind). The continent
// colours are never on screen with them: the list holds continents or countries, not both.
export const COUNTRY_COMPARE_COLORS = ["#5b3fd1", "#ad1457", "#26a69a", "#8d6e00", "#0088ee"];
