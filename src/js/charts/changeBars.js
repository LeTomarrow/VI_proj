// View B: change in renewable share of each country of the continent, from the range start to
// the selected year, sorted from the largest gain. Bars start at zero; names sit on the other
// side of the zero line, so they never cover a bar. Colour = the map's Change scale.
// Base example: Diverging bar chart (https://observablehq.com/@d3/diverging-bar-chart).

import { openEntityMenu } from "../entityMenu.js";
import { metricColor } from "../scales.js";
import { setState } from "../state.js";
import { hideTooltip, showTooltip } from "../tooltip.js";
import { fitToSize } from "./fitToSize.js";

const MARGIN = { top: 16, right: 16, bottom: 40, left: 16 };
const MIN_DOMAIN = 10;  // pp, so small changes are not blown up to the full width
const LABEL_H = 11;     // rows thinner than this get a name only when marked or extreme
const EXTREMES = 3;     // largest gains and losses always named
const colorOf = metricColor("renewableShare", "change");
const fmt = d3.format("+.1f");
const share = (r) => r?.renewableShare ?? null;
const missingText = (n) => (n === 1 ? "1 country has" : `${n} countries have`);

function tooltipHtml(d, start, end, world) {
  const row = (label, value) => `<div class="tooltip-row"><span>${label}</span><span>${value}</span></div>`;
  const vsWorld = world === null ? ""
    : `<div class="tooltip-note">World: ${fmt(world)} pp</div>`;
  return `<strong>${d.name}</strong>`
    + row(`Renewable share ${start}`, `${d.from.toFixed(1)}%`)
    + row(`Renewable share ${end}`, `${d.to.toFixed(1)}%`)
    + row("Change", `${fmt(d.value)} pp`)
    + `${vsWorld}<div class="tooltip-note">Click for details or + Compare</div>`;
}

export function createChangeBars(selector, { countries, world, countriesOf }) {
  const byCountry = d3.index(countries, (r) => r.key, (r) => r.year);
  const byWorld = d3.index(world, (r) => r.year);
  const x = d3.scaleLinear();
  const y = d3.scaleBand().paddingInner(0.2);

  const root = d3.select(selector);
  const note = root.append("p").attr("class", "how-to-read scatter-note").attr("role", "status");
  const svg = root.append("svg").attr("role", "img");
  const plot = svg.append("g").attr("transform", `translate(${MARGIN.left}, ${MARGIN.top})`);
  const xAxis = plot.append("g").attr("class", "axis");
  const xTitle = plot.append("text").attr("class", "axis-title").attr("text-anchor", "middle")
    .text("Change in renewable share (percentage points)");
  const bars = plot.append("g");
  const zero = plot.append("line").attr("class", "zero-line");
  const worldLine = plot.append("line").attr("class", "reference-line");
  const worldLabel = plot.append("text").attr("class", "axis-title").attr("text-anchor", "middle").text("World");
  const labels = plot.append("g");
  const hits = plot.append("g");

  let innerW = 0;
  let innerH = 0;
  let current = null;

  function resize(width, height) {
    innerW = width - MARGIN.left - MARGIN.right;
    innerH = height - MARGIN.top - MARGIN.bottom;
    x.range([0, innerW]);
    y.range([0, innerH]);
    xTitle.attr("x", innerW / 2).attr("y", innerH + 34);
    if (current) render(current);
  }

  function render(s) {
    const start = s.rangeStart;
    const end = s.year;
    const keys = countriesOf.get(s.continent) ?? [];
    const rows = end > start ? keys.map((key) => {
      const from = share(byCountry.get(key)?.get(start));
      const to = share(byCountry.get(key)?.get(end));
      return { key, name: byCountry.get(key)?.get(end)?.name ?? key, from, to, value: from === null || to === null ? null : to - from };
    }).filter((d) => d.value !== null).sort((a, b) => b.value - a.value) : [];
    const w0 = share(byWorld.get(start));
    const w1 = share(byWorld.get(end));
    const worldChange = rows.length && w0 !== null && w1 !== null ? w1 - w0 : null;

    note.text(end <= start
      ? `Choose a year after ${start} (or set the start with Range average or Change).`
      : rows.length < keys.length ? `${missingText(keys.length - rows.length)} no data for ${start} or ${end}.` : "");
    svg.attr("aria-label", `Bar chart of the change in renewable share of ${rows.length} countries of ${s.continent}, ${start}–${end}, sorted.`);

    // Zero stays at least 40% in from the side the bars do not use, to leave room for the names.
    const lo = Math.min(0, d3.min(rows, (d) => d.value) ?? 0);
    const hi = Math.max(MIN_DOMAIN, d3.max(rows, (d) => d.value) ?? 0);
    x.domain([Math.min(lo, -0.6 * hi), Math.max(hi, -0.6 * lo)]).nice();
    y.domain(rows.map((d) => d.key));
    xAxis.attr("transform", `translate(0, ${innerH})`)
      .call(d3.axisBottom(x).ticks(Math.max(3, innerW / 70)).tickFormat((v) => (v ? d3.format("+")(v) : "0")).tickSize(4));
    zero.attr("x1", x(0)).attr("x2", x(0)).attr("y1", 0).attr("y2", innerH)
      .attr("display", rows.length ? null : "none");
    worldLine.attr("display", worldChange === null ? "none" : null)
      .attr("x1", x(worldChange ?? 0)).attr("x2", x(worldChange ?? 0)).attr("y1", 0).attr("y2", innerH);
    worldLabel.attr("display", worldChange === null ? "none" : null)
      .attr("x", x(worldChange ?? 0)).attr("y", -5);

    const outside = (d) => !!s.brushed && !s.brushed.has(d.key) && d.key !== s.hovered;
    bars.selectAll("rect").data(rows, (d) => d.key).join("rect")
      .attr("class", "change-bar")
      .attr("x", (d) => x(Math.min(0, d.value)))
      .attr("width", (d) => Math.max(1, Math.abs(x(d.value) - x(0))))
      .attr("y", (d) => y(d.key))
      .attr("height", y.bandwidth())
      .attr("fill", (d) => colorOf(d.value))
      .classed("is-compared", (d) => s.compared.includes(d.key))
      .classed("is-hovered", (d) => d.key === s.hovered)
      .classed("is-outside", outside);
    bars.selectAll("rect.is-compared, rect.is-hovered").raise();

    // Every name when the rows are tall enough; otherwise the hovered, compared, brushed and
    // extreme ones, skipping any that would overlap.
    const roomy = y.step() >= LABEL_H;
    const rank = (d, i) => {
      if (d.key === s.hovered) return 0;
      if (s.compared.includes(d.key)) return 1;
      if (s.brushed?.has(d.key)) return 2;
      if (!s.brushed && (i < EXTREMES || i >= rows.length - EXTREMES)) return 3;
      return roomy ? 4 : null;
    };
    const taken = [];
    const named = rows.map((d, i) => ({ d, rank: rank(d, i) }))
      .filter((c) => c.rank !== null)
      .sort((a, b) => a.rank - b.rank)
      .filter(({ d, rank: r }) => {
        const cy = y(d.key) + y.bandwidth() / 2;
        if (r > 1 && taken.some((t) => Math.abs(t - cy) < LABEL_H)) return false;
        taken.push(cy);
        return true;
      })
      .map((c) => c.d);
    labels.selectAll("text").data(named, (d) => d.key).join("text")
      .attr("class", (d) => `bar-label${s.compared.includes(d.key) ? " is-compared" : ""}${outside(d) ? " is-outside" : ""}`)
      .attr("x", (d) => x(0) + (d.value >= 0 ? -4 : 4))
      .attr("y", (d) => y(d.key) + y.bandwidth() / 2)
      .attr("dy", "0.32em")
      .attr("text-anchor", (d) => (d.value >= 0 ? "end" : "start"))
      .text((d) => `${s.compared.includes(d.key) ? "✓ " : ""}${d.name} ${fmt(d.value)}`);

    // One full-width row per country, so thin bars are easy to hover.
    hits.selectAll("rect").data(rows, (d) => d.key).join("rect")
      .attr("class", "hit-area is-clickable")
      .attr("x", 0).attr("width", innerW)
      .attr("y", (d) => y(d.key) - (y.step() - y.bandwidth()) / 2)
      .attr("height", y.step())
      .on("mouseenter", (_, d) => setState({ hovered: d.key }))
      .on("mousemove", (event, d) => showTooltip(event, tooltipHtml(d, start, end, worldChange)))
      .on("mouseleave", () => { setState({ hovered: null }); hideTooltip(); })
      .on("click", (event, d) => openEntityMenu(event, d.key, d.name));
  }

  fitToSize(svg, resize);

  return {
    update(s) {
      if (s.level !== "continent") return;
      current = s;
      if (innerH > 0) render(s);
    },
  };
}
