// Emissions from electricity by continent, absolute MtCO₂e, on a fixed 2000–2024 axis (before
// 2000 continent sums jump when countries enter the data).
// - Comparison list empty: stacked area; the top edge is the world total (T1).
// - Continents in the comparison list: one line per compared continent from zero, y axis fitted
//   to them, so their emissions share a baseline and thin continents (Oceania) stay readable.
// Base example: Stacked area chart (https://observablehq.com/@d3/stacked-area-chart).

import { COMPLETE_YEARS } from "../data/constants.js";
import { openEntityMenu } from "../entityMenu.js";
import { CONTINENT_COLORS } from "../scales.js";
import { isDimmed, setState } from "../state.js";
import { hideTooltip, showTooltip } from "../tooltip.js";
import { fitToSize } from "./fitToSize.js";
import { hitZones, zoneAt } from "./hitZones.js";

// Stack order (largest emitters at the bottom); colours in scales.js are validated for it.
// Colour follows the continent and never changes.
const EMISSIONS_STACK = ["Asia", "North America", "Europe", "Africa", "South America", "Oceania"];

const MARGIN = { top: 10, right: 130, bottom: 24, left: 56 };
const LABEL_GAP = 14;   // between the names on the right, which are moved apart when needed
const MIN_HIT = 18;     // thinnest hover and click zone of a band (Oceania, South America)
const YEAR_TICK = 44;   // room for one year label

const mt = d3.format(",.0f");

// Continents of the comparison list, in stack order.
export function comparedContinents(s) {
  return EMISSIONS_STACK.filter((k) => s.compared.includes(k));
}

// Names at the right edge, top to bottom, at least LABEL_GAP apart and inside the plot.
function dodge(ends, height) {
  ends.sort((a, b) => a.at - b.at);
  ends.forEach((d, i) => { d.y = Math.max(d.at, i ? ends[i - 1].y + LABEL_GAP : LABEL_GAP / 2); });
  for (let i = ends.length - 1; i >= 0; i--) {
    ends[i].y = Math.min(ends[i].y, i < ends.length - 1 ? ends[i + 1].y - LABEL_GAP : height - LABEL_GAP / 2);
  }
  return ends;
}

export function createEmissionsArea(selector, { continents }) {
  const years = d3.range(COMPLETE_YEARS[0], COMPLETE_YEARS[1] + 1);
  const index = d3.index(continents, (r) => r.year, (r) => r.key);
  const rows = years.map((year) => ({
    year,
    ...Object.fromEntries(EMISSIONS_STACK.map((k) => [k, index.get(year).get(k).emissions])),
  }));
  const worldOf = (row) => d3.sum(EMISSIONS_STACK, (k) => row[k]);
  const series = d3.stack().keys(EMISSIONS_STACK)(rows);
  const stackMax = d3.max(series.at(-1), (d) => d[1]);

  const x = d3.scaleLinear().domain(COMPLETE_YEARS);
  const y = d3.scaleLinear();
  const area = d3.area().x((d) => x(d.data.year)).y0((d) => y(d[0])).y1((d) => y(d[1]));
  const line = (key) => d3.line().x((r) => x(r.year)).y((r) => y(r[key]))(rows);
  let innerW = 0;
  let innerH = 0;
  let current = null;
  let shown = []; // compared continents drawn as lines; empty = stack
  let sized = false; // the size changed since the last layout

  const root = d3.select(selector);
  const legend = root.append("ul").attr("class", "legend");
  const items = legend.selectAll("li").data(EMISSIONS_STACK).join("li")
    .attr("class", "is-clickable")
    .on("mouseenter", (_, key) => setState({ hovered: key }))
    .on("mouseleave", () => setState({ hovered: null }))
    .on("click", (event, key) => openEntityMenu(event, key));
  items.append("span").attr("class", "swatch").style("background", (key) => CONTINENT_COLORS[key]);
  const itemNames = items.append("span");

  const svg = root.append("svg").attr("role", "img");
  const plot = svg.append("g").attr("transform", `translate(${MARGIN.left}, ${MARGIN.top})`);

  const grid = plot.append("g").attr("class", "grid");
  const range = plot.append("rect").attr("class", "range-band");
  const bands = plot.append("g").selectAll("path.band").data(series, (d) => d.key).join("path")
    .attr("class", "band")
    .attr("fill", (d) => CONTINENT_COLORS[d.key]);
  const lines = plot.append("g");
  const xAxis = plot.append("g").attr("class", "axis");
  const yAxis = plot.append("g").attr("class", "axis");
  const yTitle = plot.append("text").attr("class", "axis-title").attr("text-anchor", "middle").text("MtCO₂e");
  const labels = plot.append("g");
  const yearLine = plot.append("line").attr("class", "year-line").attr("y1", 0);
  const crosshair = plot.append("line").attr("class", "crosshair").attr("y1", 0).attr("display", "none");

  // Year and continent under the pointer. Stack: thin bands get a wider zone. Lines: the
  // nearest line at that year.
  function pick(event) {
    const [px, py] = d3.pointer(event);
    const i = d3.bisectCenter(years, x.invert(px));
    const row = rows[i];
    if (shown.length) return { row, key: d3.least(shown, (k) => Math.abs(y(row[k]) - py)) };
    const zones = hitZones(series.map((s) => [innerH - y(s[i][0]), innerH - y(s[i][1])]), MIN_HIT);
    return { row, key: series[zoneAt(zones, innerH - py)]?.key };
  }

  const hitArea = plot.append("rect").attr("class", "hit-area is-clickable")
    .on("click", (event) => {
      const { key } = pick(event);
      if (key) openEntityMenu(event, key);
    })
    .on("mousemove", (event) => {
      const { row, key } = pick(event);
      crosshair.attr("display", null).attr("x1", x(row.year)).attr("x2", x(row.year));
      // Largest emitter first, as in the legend; the world total keeps the context.
      showTooltip(event, `<strong>${row.year}</strong>${(shown.length ? shown : EMISSIONS_STACK)
        .map((k) => `<div class="tooltip-row${k === key ? " is-current" : ""}"><span>${k}</span><span>${mt(row[k])} MtCO₂e</span></div>`)
        .join("")}<div class="tooltip-row is-total"><span>World</span><span>${mt(worldOf(row))} MtCO₂e</span></div>`);
      setState({ hovered: key ?? null });
    })
    .on("mouseleave", () => {
      crosshair.attr("display", "none");
      hideTooltip();
      setState({ hovered: null });
    });

  function resize(width, height) {
    innerW = width - MARGIN.left - MARGIN.right;
    innerH = height - MARGIN.top - MARGIN.bottom;
    x.range([0, innerW]);
    y.range([innerH, 0]);
    range.attr("height", innerH);
    xAxis.attr("transform", `translate(0, ${innerH})`)
      .call(d3.axisBottom(x).ticks(Math.min(years.length - 1, Math.floor(innerW / YEAR_TICK))).tickFormat(d3.format("d")).tickSize(4));
    yTitle.attr("transform", `translate(-46, ${innerH / 2}) rotate(-90)`);
    yearLine.attr("y2", innerH);
    crosshair.attr("y2", innerH);
    hitArea.attr("width", innerW).attr("height", innerH);
    sized = true;
    if (current) render(current);
  }

  // Everything that depends on the shown continents: y scale, marks and the names on the right.
  function layout() {
    y.domain([0, shown.length ? d3.max(rows, (r) => d3.max(shown, (k) => r[k])) : stackMax]).nice();
    const yTicks = Math.max(2, Math.floor(innerH / 40));
    grid.call(d3.axisLeft(y).ticks(yTicks).tickSize(-innerW).tickFormat(""))
      .call((g) => g.select(".domain").remove());
    yAxis.call(d3.axisLeft(y).ticks(yTicks).tickFormat(d3.format(",")).tickSize(4))
      .call((g) => g.select(".domain").remove());

    bands.attr("display", shown.length ? "none" : null).attr("d", shown.length ? null : area);
    lines.selectAll("path").data(shown, (k) => k).join("path")
      .attr("class", "emission-line")
      .attr("stroke", (k) => CONTINENT_COLORS[k])
      .attr("d", line);

    const last = rows.at(-1);
    const ends = shown.length
      ? shown.map((key) => ({ key, value: last[key], at: y(last[key]) }))
      : series.map((s) => ({ key: s.key, value: s.at(-1)[1] - s.at(-1)[0], at: (y(s.at(-1)[0]) + y(s.at(-1)[1])) / 2 }));
    const label = labels.selectAll("g.band-label-group").data(dodge(ends, innerH), (d) => d.key).join((enter) => {
      const g = enter.append("g").attr("class", "band-label-group is-clickable")
        .on("mouseenter", (_, d) => setState({ hovered: d.key }))
        .on("mouseleave", () => setState({ hovered: null }))
        .on("click", (event, d) => openEntityMenu(event, d.key));
      g.append("path").attr("class", "leader-line");
      g.append("rect").attr("class", "hit-area");
      g.append("text").attr("class", "band-label").attr("dy", "0.32em");
      return g;
    });
    label.select(".leader-line").attr("d", (d) => `M${innerW + 1},${d.at}L${innerW + 6},${d.y}`);
    label.select(".band-label").attr("x", innerW + 8).attr("y", (d) => d.y);
    label.select(".hit-area")
      .attr("x", innerW + 2).attr("y", (d) => d.y - LABEL_GAP / 2)
      .attr("width", MARGIN.right - 4).attr("height", LABEL_GAP);

    svg.attr("aria-label", shown.length
      ? `Lines of CO₂ from electricity, 2000 to 2024: ${shown.join(", ")}`
      : "Stacked area of CO₂ from electricity by continent, 2000 to 2024");
  }

  function render(s) {
    // Layout only when the size or the shown continents change, not on every hover.
    const next = comparedContinents(s);
    if (sized || `${next}` !== `${shown}`) {
      shown = next;
      sized = false;
      layout();
    }

    const isCompared = (key) => s.compared.includes(key);
    const name = (key) => (isCompared(key) ? `✓ ${key}` : key);
    bands.classed("is-hovered", (d) => d.key === s.hovered);
    bands.filter(".is-hovered").raise();
    lines.selectAll("path").classed("is-hovered", (k) => k === s.hovered);
    // Legend: the continents not drawn as lines move to the background but stay clickable, so
    // they can be added to the comparison from here.
    items.classed("is-compared", isCompared).classed("is-dimmed", (key) => isDimmed(key, s, EMISSIONS_STACK));
    itemNames.text(name);
    labels.selectAll(".band-label")
      .classed("is-hovered", (d) => d.key === s.hovered)
      .text((d) => `${d.key} ${mt(d.value)}`);

    const inAxis = s.year >= COMPLETE_YEARS[0] && s.year <= COMPLETE_YEARS[1];
    yearLine.attr("display", inAxis ? null : "none").attr("x1", x(s.year)).attr("x2", x(s.year));

    const ranged = s.mode !== "year";
    const from = Math.max(s.rangeStart, COMPLETE_YEARS[0]);
    const to = Math.min(s.year, COMPLETE_YEARS[1]);
    range.attr("display", ranged && from < to ? null : "none").attr("x", x(from)).attr("width", Math.max(0, x(to) - x(from)));
  }

  fitToSize(svg, resize);

  return {
    update(s) {
      current = s;
      if (innerH > 0) render(s);
    },
  };
}
