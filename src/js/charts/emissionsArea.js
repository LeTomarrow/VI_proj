// Stacked area of emissions from electricity by continent, absolute MtCO₂e, on a fixed
// 2000–2024 axis (before 2000 continent sums jump when countries enter the data).
// Base example: Stacked area chart (https://observablehq.com/@d3/stacked-area-chart).

import { COMPLETE_YEARS } from "../data/constants.js";
import { setState } from "../state.js";
import { hideTooltip, showTooltip } from "../tooltip.js";
import { fitToSize } from "./fitToSize.js";
import { hitZones, zoneAt } from "./hitZones.js";

// Stack order (largest emitters at the bottom), with colours validated for this adjacency.
// Colour follows the continent and never changes.
const EMISSIONS_STACK = ["Asia", "North America", "Europe", "Africa", "South America", "Oceania"];
const CONTINENT_COLORS = {
  Asia: "#2a78d6",
  "North America": "#eb6834",
  Europe: "#1baf7a",
  Africa: "#eda100",
  "South America": "#e87ba4",
  Oceania: "#008300",
};

const MARGIN = { top: 10, right: 130, bottom: 24, left: 56 };
const MIN_LABEL_H = 13; // thinnest band that fits a continent name
const MIN_HIT = 12;     // thinnest hover zone of a band
const YEAR_TICK = 44;   // room for one year label

const mt = d3.format(",.0f");

export function createEmissionsArea(selector, { continents }) {
  const years = d3.range(COMPLETE_YEARS[0], COMPLETE_YEARS[1] + 1);
  const index = d3.index(continents, (r) => r.year, (r) => r.key);
  const rows = years.map((year) => ({
    year,
    ...Object.fromEntries(EMISSIONS_STACK.map((k) => [k, index.get(year).get(k).emissions])),
  }));
  const series = d3.stack().keys(EMISSIONS_STACK)(rows);

  const x = d3.scaleLinear().domain(COMPLETE_YEARS);
  const y = d3.scaleLinear().domain([0, d3.max(series.at(-1), (d) => d[1])]).nice();
  const area = d3.area().x((d) => x(d.data.year)).y0((d) => y(d[0])).y1((d) => y(d[1]));
  let innerH = 0;
  let current = null;

  const root = d3.select(selector);
  const legend = root.append("ul").attr("class", "legend");
  const items = legend.selectAll("li").data(EMISSIONS_STACK).join("li")
    .on("mouseenter", (_, key) => setState({ hovered: key }))
    .on("mouseleave", () => setState({ hovered: null }));
  items.append("span").attr("class", "swatch").style("background", (key) => CONTINENT_COLORS[key]);
  items.append("span").text((key) => key);

  const svg = root.append("svg")
    .attr("role", "img")
    .attr("aria-label", "Stacked area of CO₂ from electricity by continent, 2000 to 2024");
  const plot = svg.append("g").attr("transform", `translate(${MARGIN.left}, ${MARGIN.top})`);

  const grid = plot.append("g").attr("class", "grid");
  const range = plot.append("rect").attr("class", "range-band");
  const bands = plot.append("g").selectAll("path.band").data(series, (d) => d.key).join("path")
    .attr("class", "band")
    .attr("fill", (d) => CONTINENT_COLORS[d.key]);
  const xAxis = plot.append("g").attr("class", "axis");
  const yAxis = plot.append("g").attr("class", "axis");
  const yTitle = plot.append("text").attr("class", "axis-title").attr("text-anchor", "middle").text("MtCO₂e");
  const labels = plot.append("g");
  const yearLine = plot.append("line").attr("class", "year-line").attr("y1", 0);
  const crosshair = plot.append("line").attr("class", "crosshair").attr("y1", 0).attr("display", "none");

  // Hit area bigger than the marks: nearest year on x; on y, thin bands get a wider zone.
  const hitArea = plot.append("rect").attr("class", "hit-area")
    .on("mousemove", (event) => {
      const [px, py] = d3.pointer(event);
      const i = d3.bisectCenter(years, x.invert(px));
      const row = rows[i];
      const zones = hitZones(series.map((s) => [innerH - y(s[i][0]), innerH - y(s[i][1])]), MIN_HIT);
      const band = series[zoneAt(zones, innerH - py)];
      crosshair.attr("display", null).attr("x1", x(row.year)).attr("x2", x(row.year));
      // Largest emitter first, as in the legend.
      showTooltip(event, `<strong>${row.year}</strong>${EMISSIONS_STACK
        .map((k) => `<div class="tooltip-row${k === band?.key ? " is-current" : ""}"><span>${k}</span><span>${mt(row[k])} MtCO₂e</span></div>`)
        .join("")}<div class="tooltip-row is-total"><span>World</span><span>${mt(d3.sum(EMISSIONS_STACK, (k) => row[k]))} MtCO₂e</span></div>`);
      setState({ hovered: band?.key ?? null });
    })
    .on("mouseleave", () => {
      crosshair.attr("display", "none");
      hideTooltip();
      setState({ hovered: null });
    });

  function resize(width, height) {
    const innerW = width - MARGIN.left - MARGIN.right;
    innerH = height - MARGIN.top - MARGIN.bottom;
    x.range([0, innerW]);
    y.range([innerH, 0]);
    const yTicks = Math.max(2, Math.floor(innerH / 40));

    grid.call(d3.axisLeft(y).ticks(yTicks).tickSize(-innerW).tickFormat(""))
      .call((g) => g.select(".domain").remove());
    bands.attr("d", area);
    range.attr("height", innerH);
    xAxis.attr("transform", `translate(0, ${innerH})`)
      .call(d3.axisBottom(x).ticks(Math.min(years.length - 1, Math.floor(innerW / YEAR_TICK))).tickFormat(d3.format("d")).tickSize(4));
    yAxis.call(d3.axisLeft(y).ticks(yTicks).tickFormat(d3.format(",")).tickSize(4))
      .call((g) => g.select(".domain").remove());
    yTitle.attr("transform", `translate(-46, ${innerH / 2}) rotate(-90)`);

    labels.selectAll("text")
      .data(series.filter((s) => y(s.at(-1)[0]) - y(s.at(-1)[1]) >= MIN_LABEL_H), (d) => d.key)
      .join("text")
      .attr("class", "band-label")
      .attr("x", innerW + 8)
      .attr("y", (s) => (y(s.at(-1)[0]) + y(s.at(-1)[1])) / 2)
      .attr("dy", "0.32em")
      .text((s) => `${s.key} ${mt(s.at(-1)[1] - s.at(-1)[0])}`);

    yearLine.attr("y2", innerH);
    crosshair.attr("y2", innerH);
    hitArea.attr("width", innerW).attr("height", innerH);
    if (current) render(current);
  }

  function render(s) {
    bands.classed("is-hovered", (d) => d.key === s.hovered).filter(".is-hovered").raise();
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
