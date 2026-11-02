// One column per entity in the selected year: width = TWh, height = share of each source.
// Base example: Marimekko chart (https://observablehq.com/@d3/marimekko-chart).

import { NO_DATA, SOURCE_GROUPS, SOURCE_LABELS } from "../scales.js";
import { setState } from "../state.js";
import { hideTooltip, showTooltip } from "../tooltip.js";

const WIDTH = 600;
const HEIGHT = 420;
const MARGIN = { top: 92, right: 44, bottom: 44, left: 46 };
const INNER_W = WIDTH - MARGIN.left - MARGIN.right;
const INNER_H = HEIGHT - MARGIN.top - MARGIN.bottom;
const STRIP = 10;       // the map colour, above the column
const GAP = 2;          // between columns and between segments
const MIN_LABEL_H = 15; // smallest segment that fits a source name
const WIDE_COLUMN = 70; // narrower columns get a slanted name
const LABEL_SPACING = 13; // between slanted names

const format = (digits) => d3.format(`,.${digits}f`);

function sourceTooltip(record, group) {
  const twh = d3.sum(group.parts, (k) => record.sources[k]);
  const share = d3.sum(group.parts, (k) => record.shares[k]);
  const parts = group.parts.length > 1
    ? group.parts.map((k) => `<div class="tooltip-note">${SOURCE_LABELS[k]}: ${format(1)(record.sources[k])} TWh</div>`).join("")
    : "";
  return `<strong>${record.name}, ${record.year}</strong><div>${group.label}: ${format(1)(twh)} TWh (${format(1)(share)}%)</div>${parts}`;
}

// maxTotal keeps the x scale fixed across years, so wider columns show growth (U5).
export function createMarimekko(selector, { maxTotal }) {
  const x = d3.scaleLinear().domain([0, maxTotal]).range([0, INNER_W]);
  const y = d3.scaleLinear().domain([0, 100]).range([INNER_H, 0]);

  const root = d3.select(selector);
  const legend = root.append("ul").attr("class", "legend");
  const items = legend.selectAll("li").data(SOURCE_GROUPS).join("li");
  items.append("span").attr("class", "swatch").style("background", (d) => d.color);
  items.append("span").text((d) => d.label);

  const svg = root.append("svg")
    .attr("viewBox", `0 0 ${WIDTH} ${HEIGHT}`)
    .attr("role", "img")
    .attr("aria-label", "Marimekko chart of the electricity mix by continent");
  const defs = svg.append("defs");
  defs.append("pattern")
    .attr("id", "mekko-hatch").attr("patternUnits", "userSpaceOnUse")
    .attr("width", 6).attr("height", 6).attr("patternTransform", "rotate(45)")
    .append("line").attr("x1", 0).attr("x2", 0).attr("y1", 0).attr("y2", 6)
    .attr("stroke", "#fcfcfb").attr("stroke-opacity", 0.7).attr("stroke-width", 1.5);

  const plot = svg.append("g").attr("transform", `translate(${MARGIN.left}, ${MARGIN.top})`);

  plot.append("g").attr("class", "axis")
    .call(d3.axisLeft(y).tickValues([0, 25, 50, 75, 100]).tickFormat((d) => `${d}%`).tickSize(4))
    .call((g) => g.select(".domain").remove());
  plot.append("text").attr("class", "axis-title")
    .attr("transform", `translate(-34, ${INNER_H / 2}) rotate(-90)`)
    .attr("text-anchor", "middle")
    .text("Share of generation (%)");
  plot.append("g").attr("class", "axis").attr("transform", `translate(0, ${INNER_H})`)
    .call(d3.axisBottom(x).ticks(6).tickFormat(d3.format(",")).tickSize(4));
  plot.append("text").attr("class", "axis-title")
    .attr("x", INNER_W / 2).attr("y", INNER_H + 36).attr("text-anchor", "middle")
    .text("Generation (TWh): a wider column means more electricity");

  const columns = plot.append("g");
  plot.append("line").attr("class", "reference-line")
    .attr("x1", 0).attr("x2", INNER_W).attr("y1", y(50)).attr("y2", y(50));

  return {
    update(records, stats, s, stripColor) {
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
        const g = enter.append("g").attr("class", "column")
          .on("mouseenter", (_, d) => setState({ hovered: d.record.key }))
          .on("mouseleave", () => { setState({ hovered: null }); hideTooltip(); });
        g.append("rect").attr("class", "column-strip").attr("y", -STRIP - GAP).attr("height", STRIP);
        g.append("text").attr("class", "column-label");
        g.append("rect").attr("class", "column-hatch").attr("height", INNER_H).attr("fill", "url(#mekko-hatch)");
        return g;
      });

      groups
        .attr("transform", (d) => `translate(${d.x0}, 0)`)
        .classed("is-faded", (d) => s.hovered !== null && d.record.key !== s.hovered);

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
        .attr("display", (d) => (stats.get(d.record.key).partial ? null : "none"));

      groups.selectAll("rect.segment")
        .data((d) => d.segments.map((segment) => ({ ...segment, column: d })), (d) => d.group.key)
        .join("rect")
        .attr("class", "segment")
        .attr("y", (d) => y(d.y1))
        .attr("width", (d) => columnWidth(d.column))
        .attr("height", (d) => Math.max(0, y(d.y0) - y(d.y1) - (d.y1 - d.y0 > 1 ? GAP : 0)))
        .attr("fill", (d) => d.group.color)
        .on("mousemove", (event, d) => showTooltip(event, sourceTooltip(d.column.record, d.group)));
      groups.select(".column-hatch").raise();

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
    },
  };
}
