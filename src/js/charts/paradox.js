// Landing chart: the paradox in one picture. World electricity, % change since 2000: total
// generation, low-carbon generation and CO₂e emissions (0 = the 2000 level). The lines draw in once, the first time
// the chart is shown (not on resize, and not under reduced motion).

import { COMPLETE_YEARS } from "../data/constants.js";
import { hideTooltip, showTooltip } from "../tooltip.js";
import { fitToSize } from "./fitToSize.js";
import { drawLineIn, prefersReducedMotion as reduced } from "../motion.js";

const SERIES = [
  { key: "lowCarbon", label: "Low-carbon", color: "#2166ac" },
  { key: "generation", label: "Total generation", color: "#52514e" },
  { key: "emissions", label: "CO₂e", color: "#b2182b" },
];
const MARGIN = { top: 10, right: 140, bottom: 20, left: 44 };
const pct = d3.format("+.0f");
const pctTick = (v) => (v === 0 ? "0%" : `${pct(v)}%`);

const DRAW_MS = 1600;

export function createParadox(selector, { world }) {
  const [first, last] = COMPLETE_YEARS;
  const records = world.filter((r) => r.year >= first && r.year <= last).sort((a, b) => a.year - b.year);
  const base = records[0];
  const rows = records.map((r) => ({
    year: r.year,
    ...Object.fromEntries(SERIES.map((s) => [s.key, (100 * (r[s.key] - base[s.key])) / base[s.key]])),
    record: r,
  }));

  function drawIn(path) {
    if (drawn || reduced()) return;
    drawLineIn(path, DRAW_MS);
  }

  const svg = d3.select(selector).append("svg").attr("role", "img")
    .attr("aria-label", `World electricity change since ${first}: low-carbon generation, total generation and CO₂e emissions all rose by ${last}.`);

  let drawn = false;
  fitToSize(svg, (width, height) => {
    svg.selectAll("*").remove();
    const w = width - MARGIN.left - MARGIN.right;
    const h = height - MARGIN.top - MARGIN.bottom;
    const g = svg.append("g").attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);
    const x = d3.scaleLinear().domain([first, last]).range([0, w]);
    const y = d3.scaleLinear().domain([Math.min(0, d3.min(rows, (r) => d3.min(SERIES, (s) => r[s.key]))), d3.max(rows, (r) => d3.max(SERIES, (s) => r[s.key]))]).nice(3).range([h, 0]);
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).tickValues([first, 2010, last]).tickFormat(d3.format("d")).tickSizeOuter(0));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(3).tickFormat(pctTick).tickSizeOuter(0));
    g.append("line").attr("class", "reference-line").attr("x1", 0).attr("x2", w).attr("y1", y(0)).attr("y2", y(0));
    for (const s of SERIES) {
      g.append("path").datum(rows).attr("fill", "none").attr("stroke", s.color).attr("stroke-width", 2.5)
        .attr("stroke-linejoin", "round")
        .attr("d", d3.line((r) => x(r.year), (r) => y(r[s.key])))
        .call((path) => drawIn(path));
    }
    // Direct labels at the end of each line, moved apart when they would overlap.
    const ends = SERIES.map((s) => ({ ...s, y: y(rows.at(-1)[s.key]), value: rows.at(-1)[s.key] })).sort((a, b) => a.y - b.y);
    for (let i = 1; i < ends.length; i++) ends[i].y = Math.max(ends[i].y, ends[i - 1].y + 13);
    g.selectAll("text.paradox-label").data(ends).join("text").attr("class", "paradox-label")
      .attr("x", w + 6).attr("y", (d) => d.y).attr("dy", "0.32em").attr("fill", (d) => d.color)
      .text((d) => `${d.label} ${pct(d.value)}%`)
      .call((labels) => { if (!drawn && !reduced()) labels.style("opacity", 0).transition().delay(DRAW_MS).duration(400).style("opacity", 1); });
    drawn = true;
    const cursor = g.append("line").attr("class", "crosshair").attr("y1", 0).attr("y2", h).attr("visibility", "hidden");
    g.append("rect").attr("class", "hit-area").attr("width", w).attr("height", h)
      .on("mousemove", (event) => {
        const year = Math.round(x.invert(d3.pointer(event)[0]));
        const row = rows.find((r) => r.year === year);
        if (!row) return;
        cursor.attr("visibility", "visible").attr("x1", x(year)).attr("x2", x(year));
        const r = row.record;
        showTooltip(event, `<strong>World, ${year}</strong><div class="tooltip-note">change since ${first}</div>`
          + `<div class="tooltip-row"><span>Low-carbon</span><span>${pct(row.lowCarbon)}% · ${d3.format(",.0f")(r.lowCarbon)} TWh</span></div>`
          + `<div class="tooltip-row"><span>Total generation</span><span>${pct(row.generation)}% · ${d3.format(",.0f")(r.generation)} TWh</span></div>`
          + `<div class="tooltip-row"><span>CO₂e</span><span>${pct(row.emissions)}% · ${d3.format(",.0f")(r.emissions)} MtCO₂e</span></div>`);
      })
      .on("mouseleave", () => { cursor.attr("visibility", "hidden"); hideTooltip(); });
  });
}
