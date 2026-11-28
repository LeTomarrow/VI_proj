// View B: did the renewable share rise, and did emissions fall? (task T2) One row per country of
// the continent, from the range start to the selected year, sorted from the largest gain in
// renewable share. Bars of the change in renewable share (pp), and beside them a CO₂e column:
// ▼ fell / ▲ rose with the change in emissions from electricity (%), so each row reads on its own
// ("Germany +32.5 ▼ 48%"). Not bars: over 2000-2024 Asian emissions rise by hundreds of percent
// (Cambodia +2680%), which no shared scale can show. Names in a gutter on the left. Top 10 or All.
// Base example: Diverging bar chart (https://observablehq.com/@d3/diverging-bar-chart).

import { changeRows, changeCountryKeys } from "../data/change.js";
import { openEntityMenu } from "../entityMenu.js";
import { metricColor, svgUnitText } from "../scales.js";
import { comparisonType, setState } from "../state.js";
import { tween } from "../motion.js";
import { hideTooltip, showTooltip } from "../tooltip.js";
import { fitToSize } from "./fitToSize.js";

const MARGIN = { top: 30, right: 8, bottom: 24, left: 4 };
const GAP = 14;         // between the columns
const NAME_W = [64, 108]; // name gutter, px (min, max); 28% of the width in between
const CO2_W = 66;       // CO₂e column: arrow + value
const VALUE_W = 30;     // room for a value label at a bar end
const VALUE_MIN_W = 110; // a narrower bar column shows no values (the tooltip has them)
const MIN_DOMAIN = 10;  // pp, so small changes are not blown up to the full width
const MAX_BAND = 22;    // thickest row, so Top 10 does not draw slabs
const LABEL_H = 11;     // rows thinner than this get a name only when marked or extreme
const EXTREMES = 3;     // largest gains and losses always named
const TOP = 10;
const VIEWS = [[TOP, `Top ${TOP}`], ["all", "All"]];
const colorOf = metricColor("renewableShare", "change");
const co2Text = (v) => `${d3.format(",.0f")(Math.abs(v))}%`;
const pp = d3.format("+.1f");
const pct = (v) => `${d3.format("+.0f")(v)}%`;
const missingText = (n) => (n === 1 ? "1 country has" : `${n} countries have`);

function tooltipHtml(d, i, total, start, end, world) {
  const row = (label, value) => `<div class="tooltip-row"><span>${label}</span><span>${value}</span></div>`;
  const vsWorld = world ? `<div class="tooltip-note">World: ${pp(world.renewable)} pp, CO₂e ${world.emissions === null ? "no data" : pct(world.emissions)}</div>` : "";
  return `<strong>${d.name}</strong> <span class="tooltip-note">${i + 1} of ${total}</span>`
    + row(`Renewable share ${start}`, `${d.from.toFixed(1)}%`)
    + row(`Renewable share ${end}`, `${d.to.toFixed(1)}%`)
    + row("Change", `${pp(d.renewable)} pp`)
    + row("CO₂e from electricity", d.emissions === null ? "no data"
      : `${d3.format(",.1f")(d.e0)} → ${d3.format(",.1f")(d.e1)} Mt (${pct(d.emissions)})`)
    + `${vsWorld}<div class="tooltip-note">Click for details or + Compare</div>`;
}

export function createChangeBars(selector, { countries, world, countriesOf }) {
  const byCountry = d3.index(countries, (r) => r.key, (r) => r.year);
  const byWorld = new Map([["World", d3.index(world, (r) => r.year)]]);
  const x = d3.scaleLinear();
  const y = d3.scaleBand().paddingInner(0.2);

  const root = d3.select(selector);
  const tools = root.append("div").attr("class", "mekko-tools");
  const viewButtons = tools.append("div").attr("class", "segmented").attr("role", "group")
    .attr("aria-label", "Countries shown")
    .selectAll("button").data(VIEWS).join("button")
    .attr("type", "button")
    .text(([, label]) => label)
    .attr("title", ([n]) => (n === "all" ? "Every country of the continent"
      : `The first ${TOP} in the sort order (with a brush: the selected group), plus the compared countries`))
    .on("click", (_, [n]) => setState({ barsTop: n }));
  // Direction: from the largest gain, or from the smallest (the largest falls).
  const sortButton = tools.append("button").attr("type", "button").attr("class", "sort-toggle")
    .on("click", () => setState({ barsSort: current?.barsSort === "asc" ? "desc" : "asc" }));
  const note = root.append("p").attr("class", "how-to-read scatter-note").attr("role", "status");
  const svg = root.append("svg").attr("role", "img");
  const plot = svg.append("g").attr("transform", `translate(${MARGIN.left}, ${MARGIN.top})`);
  // Hovered row: a light band from the name to the CO₂e arrow, so thin rows can be followed across.
  const rowBand = plot.append("rect").attr("class", "row-band").attr("display", "none");
  const col1 = plot.append("g");
  const col2 = plot.append("g");
  const names = plot.append("g");
  const xAxis = col1.append("g").attr("class", "axis");
  const head = svgUnitText(col1.append("text").attr("class", "column-title").attr("text-anchor", "middle"),
    ["Renewables (", ["pp", "pp"], ")"]);
  const head2 = svgUnitText(col2.append("text").attr("class", "column-title").attr("text-anchor", "middle"),
    [["CO₂e", "CO₂e"], " "]);
  head2.append("tspan").attr("class", "co2-rise-text").text("▲");
  head2.append("tspan").attr("class", "co2-fall-text").text("▼");
  const bars = col1.append("g");
  const arrows = col2.append("g");
  const zero = col1.append("line").attr("class", "zero-line");
  const worldLine = col1.append("line").attr("class", "reference-line");
  const worldLabel = col1.append("text").attr("class", "axis-title").attr("text-anchor", "middle").text("World");
  const values = col1.append("g");
  const values2 = col2.append("g");
  const hits = plot.append("g");

  let innerW = 0;
  let innerH = 0;
  let nameW = 0;
  let w1 = 0;
  let current = null;

  function resize(width, height) {
    innerW = width - MARGIN.left - MARGIN.right;
    innerH = height - MARGIN.top - MARGIN.bottom;
    nameW = Math.max(NAME_W[0], Math.min(NAME_W[1], 0.28 * innerW));
    w1 = Math.max(0, innerW - nameW - 2 * GAP - CO2_W);
    col1.attr("transform", `translate(${nameW + GAP}, 0)`);
    col2.attr("transform", `translate(${nameW + 2 * GAP + w1}, 0)`);
    head.attr("x", w1 / 2).attr("y", -18);
    head2.attr("x", 0).attr("y", -18).attr("text-anchor", "start");
    if (current) render(current);
  }

  function render(s) {
    const start = s.rangeStart;
    const end = s.year;
    const comparing = s.compared.some((key) => comparisonType(key) === "countries");
    const keys = changeCountryKeys(countriesOf.get(s.continent) ?? [], s.compared, s.brushed);
    const asc = s.barsSort === "asc";
    const sorted = changeRows(keys, byCountry, start, end);
    const all = asc ? sorted.reverse() : sorted;
    sortButton.text(asc ? "↑ Smallest gain first" : "↓ Largest gain first")
      .attr("title", asc ? "Sort from the largest gain" : "Sort from the smallest gain (the largest falls)");
    const position = new Map(all.map((d, i) => [d.key, i]));
    const top = (s.barsTop ?? TOP) !== "all";
    // Top 10: the largest gains, or the brushed group; compared countries always.
    const rows = top && !comparing
      ? all.filter((d, i) => (s.brushed ? s.brushed.has(d.key) : i < TOP) || s.compared.includes(d.key))
      : all;
    const worldRow = changeRows(["World"], byWorld, start, end)[0] ?? null;
    viewButtons.attr("aria-pressed", ([n]) => String(n === (top && !comparing ? TOP : "all")))
      .property("disabled", comparing);

    const missing = all.length < keys.length ? ` ${missingText(keys.length - all.length)} no data for ${start} or ${end}.` : "";
    note.text(end <= start
      ? `Choose a year after ${start} (or set the start with Change).`
      : `${comparing ? (s.brushed ? "Selected and compared countries." : "Compared countries only.") : top ? `${rows.length} of ${all.length} countries.` : ""}${missing}`.trim());
    svg.attr("aria-label", `Bar chart of the change in renewable share and in emissions of ${rows.length} countries of ${s.continent}, ${start}-${end}, sorted.`);

    // Room for a value label beyond the longest bar on each side that has bars.
    const fit = (scale, width, lo, hi) => {
      const pad = width >= VALUE_MIN_W ? VALUE_W : 0;
      scale.domain([lo, hi]).range([lo < 0 ? pad : 0, Math.max(lo < 0 ? pad : 0, width - (hi > 0 ? pad : 0))]);
      return pad > 0;
    };
    const valuesShown = fit(x, w1, Math.min(0, d3.min(rows, (d) => d.renewable) ?? 0), Math.max(MIN_DOMAIN, d3.max(rows, (d) => d.renewable) ?? 0));
    // Rows fill the height up to MAX_BAND each, from the top.
    const usedH = Math.min(innerH, rows.length * MAX_BAND / 0.8);
    y.domain(rows.map((d) => d.key)).range([0, usedH]);

    xAxis.attr("transform", `translate(0, ${usedH})`)
      .call(d3.axisBottom(x).ticks(Math.max(1, w1 / 50)).tickFormat((v) => (v ? d3.format("+")(v) : "0")).tickSize(4));
    const show = rows.length ? null : "none";
    zero.attr("display", show).attr("x1", x(0)).attr("x2", x(0)).attr("y1", 0).attr("y2", usedH);
    const wr = rows.length ? worldRow : null;
    worldLine.attr("display", wr ? null : "none")
      .attr("x1", x(wr?.renewable ?? 0)).attr("x2", x(wr?.renewable ?? 0)).attr("y1", 0).attr("y2", usedH);
    worldLabel.attr("display", wr ? null : "none").attr("x", x(wr?.renewable ?? 0)).attr("y", -5);

    // Compared and hovered rows are never faded by the brush.
    const outside = (d) => !!s.brushed && !s.brushed.has(d.key) && d.key !== s.hovered && !s.compared.includes(d.key);
    const mark = (sel) => sel
      .classed("is-compared", (d) => s.compared.includes(d.key))
      .classed("is-hovered", (d) => d.key === s.hovered)
      .classed("is-outside", outside);
    bars.selectAll("rect").data(rows, (d) => d.key).join(
      (enter) => enter.append("rect").attr("x", x(0)).attr("width", 0).attr("y", (d) => y(d.key)),
    )
      .attr("class", "change-bar")
      .call(mark)
      // Rows slide to their new rank when the year, range or group changes.
      .call((sel) => tween(sel, s)
        .attr("x", (d) => x(Math.min(0, d.renewable)))
        .attr("width", (d) => Math.max(1, Math.abs(x(d.renewable) - x(0))))
        .attr("y", (d) => y(d.key))
        .attr("height", y.bandwidth())
        .attr("fill", (d) => colorOf(d.renewable)));
    bars.selectAll("rect.is-compared, rect.is-hovered").raise();
    // One arrow per row, even when the row is too thin for text: the column reads as a pattern.
    // Large enough to read as up or down at a glance (user test, T3).
    const size = Math.max(6, Math.min(14, y.bandwidth()));
    arrows.selectAll("path").data(rows.filter((d) => d.emissions !== null), (d) => d.key).join("path")
      .attr("class", (d) => `co2-arrow ${d.emissions < 0 ? "is-fall" : "is-rise"}${outside(d) ? " is-outside" : ""}`)
      .attr("d", (d) => `M${-size / 2},0L${size / 2},0L0,${d.emissions < 0 ? size : -size}Z`)
      .call((sel) => tween(sel, s)
        .attr("transform", (d) => `translate(${size / 2 + 1}, ${y(d.key) + y.bandwidth() / 2 + (d.emissions < 0 ? -size / 2 : size / 2)})`));

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
    const labelClass = (base) => (d) => `${base}${s.compared.includes(d.key) ? " is-compared" : ""}${outside(d) ? " is-outside" : ""}`;
    const cy = (d) => y(d.key) + y.bandwidth() / 2;
    names.selectAll("text").data(named, (d) => d.key).join("text")
      .attr("class", labelClass("bar-label"))
      .attr("x", nameW).attr("y", cy).attr("dy", "0.32em")
      .attr("text-anchor", "end")
      .text((d) => `${s.compared.includes(d.key) ? "✓ " : ""}${d.name}`)
      .each(function () { // shorten to the gutter
        let text = this.textContent;
        while (text.length > 3 && this.getComputedTextLength() > nameW) {
          text = text.slice(0, -1);
          this.textContent = `${text.trimEnd()}…`;
        }
      });
    const valueAt = (sel, scale, value, text) => sel
      .attr("class", labelClass("bar-label"))
      .attr("x", (d) => scale(value(d)) + (value(d) >= 0 ? 3 : -3))
      .attr("y", cy).attr("dy", "0.32em")
      .attr("text-anchor", (d) => (value(d) >= 0 ? "start" : "end"))
      .text(text);
    values.selectAll("text").data(valuesShown ? named : [], (d) => d.key).join("text")
      .call(valueAt, x, (d) => d.renewable, (d) => pp(d.renewable));
    values2.selectAll("text").data(named.filter((d) => d.emissions !== null), (d) => d.key).join("text")
      .attr("class", labelClass("bar-label"))
      .attr("x", size + 5).attr("y", cy).attr("dy", "0.32em")
      .text((d) => co2Text(d.emissions));

    const hoveredRow = rows.find((d) => d.key === s.hovered);
    rowBand.attr("display", hoveredRow ? null : "none")
      .attr("x", 0).attr("width", innerW)
      .attr("y", hoveredRow ? y(hoveredRow.key) - (y.step() - y.bandwidth()) / 2 : 0)
      .attr("height", Math.max(y.step(), 4));

    // One full-width row per country (both columns), so thin bars are easy to hover.
    hits.selectAll("rect").data(rows, (d) => d.key).join("rect")
      .attr("class", "hit-area is-clickable")
      .attr("x", -MARGIN.left).attr("width", innerW + MARGIN.left)
      .attr("y", (d) => y(d.key) - (y.step() - y.bandwidth()) / 2)
      .attr("height", y.step())
      .on("mouseenter", (_, d) => setState({ hovered: d.key }))
      .on("mousemove", (event, d) => showTooltip(event, tooltipHtml(d, position.get(d.key), all.length, start, end, worldRow)))
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
