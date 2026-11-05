// One column per entity in the selected year: width = TWh, height = share of each source.
// Base example: Marimekko chart (https://observablehq.com/@d3/marimekko-chart).

import { NO_DATA, SOURCE_GROUPS, SOURCE_LABELS } from "../scales.js";
import { setState } from "../state.js";
import { coverageLine, hideTooltip, showTooltip } from "../tooltip.js";
import { fitToSize } from "./fitToSize.js";
import { hitZones } from "./hitZones.js";

const MARGIN = { top: 92, right: 44, bottom: 40, left: 52 };
const STRIP = 10;       // the map colour, above the column
const GAP = 2;          // between columns and between segments
const MIN_LABEL_H = 15; // smallest segment that fits a source name
const WIDE_COLUMN = 70; // narrower columns get a slanted name
const LABEL_SPACING = 13; // between slanted names
const MIN_HIT = 16;     // narrowest hover zone of a column

const format = (digits) => d3.format(`,.${digits}f`);

// The whole column, in legend order, with the source under the pointer in bold.
function columnTooltip(record, stat, current) {
  const rows = SOURCE_GROUPS.map((group) => {
    const twh = d3.sum(group.parts, (k) => record.sources[k]);
    const share = d3.sum(group.parts, (k) => record.shares[k]);
    return `<div class="tooltip-row${group.key === current ? " is-current" : ""}"><span>${group.label}</span>`
      + `<span>${format(0)(twh)} TWh · ${format(1)(share)}%</span></div>`;
  }).join("");
  const parts = SOURCE_GROUPS.find((g) => g.parts.length > 1).parts
    .map((k) => `${SOURCE_LABELS[k]} ${format(0)(record.sources[k])}`).join(", ");
  return `<strong>${record.name}, ${record.year}</strong>${rows}`
    + `<div class="tooltip-row is-total"><span>Total</span><span>${format(0)(record.generation)} TWh</span></div>`
    + `<div class="tooltip-note">${parts} TWh</div>${coverageLine(stat, "year")}`;
}

// maxTotal keeps the x scale fixed across years, so wider columns show growth (U5).
export function createMarimekko(selector, { maxTotal }) {
  const x = d3.scaleLinear().domain([0, maxTotal]);
  const y = d3.scaleLinear().domain([0, 100]);
  let innerH = 0;
  let current = null;

  const root = d3.select(selector);
  const legend = root.append("ul").attr("class", "legend");
  const items = legend.selectAll("li").data(SOURCE_GROUPS).join("li");
  items.append("span").attr("class", "swatch").style("background", (d) => d.color);
  items.append("span").text((d) => d.label);

  const svg = root.append("svg")
    .attr("role", "img")
    .attr("aria-label", "Marimekko chart of the electricity mix by continent");
  const defs = svg.append("defs");
  defs.append("pattern")
    .attr("id", "mekko-hatch").attr("patternUnits", "userSpaceOnUse")
    .attr("width", 6).attr("height", 6).attr("patternTransform", "rotate(45)")
    .append("line").attr("x1", 0).attr("x2", 0).attr("y1", 0).attr("y2", 6)
    .attr("stroke", "#fcfcfb").attr("stroke-opacity", 0.7).attr("stroke-width", 1.5);

  const plot = svg.append("g").attr("transform", `translate(${MARGIN.left}, ${MARGIN.top})`);

  const yAxis = plot.append("g").attr("class", "axis");
  const yTitle = plot.append("text").attr("class", "axis-title").attr("text-anchor", "middle").text("Share (%)");
  const xAxis = plot.append("g").attr("class", "axis");
  const xTitle = plot.append("text").attr("class", "axis-title").attr("text-anchor", "middle").text("Generation (TWh)");

  const columns = plot.append("g");
  const reference = plot.append("line").attr("class", "reference-line").attr("x1", 0);
  // Above the columns, so thin columns are easy to hover.
  const hits = plot.append("g");

  function resize(width, height) {
    const innerW = width - MARGIN.left - MARGIN.right;
    innerH = height - MARGIN.top - MARGIN.bottom;
    x.range([0, innerW]);
    y.range([innerH, 0]);

    yAxis.call(d3.axisLeft(y).tickValues([0, 25, 50, 75, 100]).tickFormat((d) => `${d}%`).tickSize(4))
      .call((g) => g.select(".domain").remove());
    yTitle.attr("transform", `translate(-40, ${innerH / 2}) rotate(-90)`);
    xAxis.attr("transform", `translate(0, ${innerH})`)
      .call(d3.axisBottom(x).ticks(Math.max(2, Math.floor(innerW / 70))).tickFormat(d3.format(",")).tickSize(4));
    xTitle.attr("x", innerW / 2).attr("y", innerH + 34);
    reference.attr("x2", innerW).attr("y1", y(50)).attr("y2", y(50));
    if (current) render(...current);
  }

  function render(records, stats, s, stripColor) {
    const widest = d3.greatest(records, (r) => r.generation)?.key;
    let start = 0;
    let lastLabel = -Infinity;
    const layout = records.map((record) => {
      let top = 0;
      const segments = SOURCE_GROUPS.map((group) => {
        const share = d3.sum(group.parts, (k) => record.shares[k]);
        const segment = { group, y0: top, y1: top + share };
        top += share;
        return segment;
      });
      const column = { record, x0: x(start), width: x(record.generation), segments };
      const center = column.x0 + column.width / 2;
      column.labelShift = Math.max(0, lastLabel + LABEL_SPACING - center);
      lastLabel = center + column.labelShift;
      start += record.generation;
      return column;
    });

    const groups = columns.selectAll("g.column").data(layout, (d) => d.record.key).join((enter) => {
      const g = enter.append("g").attr("class", "column");
      g.append("rect").attr("class", "column-strip").attr("y", -STRIP - GAP).attr("height", STRIP);
      g.append("text").attr("class", "column-label");
      g.append("rect").attr("class", "column-hatch").attr("fill", "url(#mekko-hatch)");
      g.append("rect").attr("class", "column-outline").attr("y", -STRIP - GAP);
      return g;
    });

    groups
      .attr("transform", (d) => `translate(${d.x0}, 0)`)
      .classed("is-hovered", (d) => d.record.key === s.hovered);

    const columnWidth = (d) => Math.max(1, d.width - GAP);
    groups.select(".column-strip")
      .attr("width", columnWidth)
      .attr("fill", (d) => {
        const { value } = stats.get(d.record.key);
        return value === null ? NO_DATA : stripColor(value);
      });
    groups.select(".column-label")
      .text((d) => d.record.name)
      .attr("text-anchor", "start")
      .attr("transform", (d) => (d.width >= WIDE_COLUMN
        ? `translate(0, ${-STRIP - GAP - 5})`
        : `translate(${d.width / 2 + d.labelShift}, ${-STRIP - GAP - 5}) rotate(-65)`));
    groups.select(".column-hatch")
      .attr("width", columnWidth)
      .attr("height", innerH)
      .attr("display", (d) => (stats.get(d.record.key).partial ? null : "none"));

    groups.selectAll("rect.segment")
      .data((d) => d.segments.map((segment) => ({ ...segment, column: d })), (d) => d.group.key)
      .join("rect")
      .attr("class", "segment")
      .attr("y", (d) => y(d.y1))
      .attr("width", (d) => columnWidth(d.column))
      .attr("height", (d) => Math.max(0, y(d.y0) - y(d.y1) - (d.y1 - d.y0 > 1 ? GAP : 0)))
      .attr("fill", (d) => d.group.color);
    groups.select(".column-hatch").raise();
    groups.select(".column-outline").attr("width", columnWidth).attr("height", innerH + STRIP + GAP).raise();

    // Direct labels only on the widest column; the legend covers the rest.
    groups.selectAll("text.segment-label")
      .data((d) => (d.record.key === widest
        ? d.segments.filter((seg) => y(seg.y0) - y(seg.y1) >= MIN_LABEL_H).map((seg) => ({ ...seg, column: d }))
        : []), (d) => d.group.key)
      .join("text")
      .attr("class", "segment-label")
      .attr("x", 6)
      .attr("y", (d) => (y(d.y0) + y(d.y1)) / 2)
      .attr("dy", "0.32em")
      .attr("fill", (d) => (["solar", "gas", "nuclear", "wind"].includes(d.group.key) ? "#0b0b0b" : "#ffffff"))
      .text((d) => d.group.label);

    const zones = hitZones(layout.map((d) => [d.x0, d.x0 + d.width]), MIN_HIT);
    hits.selectAll("rect").data(layout, (d) => d.record.key).join("rect")
      .attr("class", "hit-area")
      .attr("x", (_, i) => zones[i][0])
      .attr("width", (_, i) => zones[i][1] - zones[i][0])
      .attr("y", -STRIP - GAP)
      .attr("height", innerH + STRIP + GAP)
      .on("mouseenter", (_, d) => setState({ hovered: d.record.key }))
      .on("mousemove", (event, d) => {
        const share = y.invert(d3.pointer(event, plot.node())[1]);
        const source = d.segments.find((seg) => share >= seg.y0 && share < seg.y1)?.group.key;
        showTooltip(event, columnTooltip(d.record, stats.get(d.record.key), source));
      })
      .on("mouseleave", () => { setState({ hovered: null }); hideTooltip(); });
  }

  fitToSize(svg, resize);

  return {
    update(...args) {
      current = args;
      if (innerH > 0) render(...args);
    },
  };
}
