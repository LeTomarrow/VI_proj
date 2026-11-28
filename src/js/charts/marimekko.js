// The electricity mix of the selected year.
// World level: a Marimekko of the continents (width = TWh, height = share of each source).
// Base example: Marimekko chart (https://observablehq.com/@d3/marimekko-chart).
// Country level: the Marimekko "deconstructed" for the persona's tasks: bars of a ranked value
// (TWh) above equal-width columns of the mix, for the ranked top N or for the compared countries.

import { openEntityMenu } from "../entityMenu.js";
import { RANKS, SOURCE_GROUPS, SOURCE_LABELS, sourceOrder, svgUnitText } from "../scales.js";
import { comparisonType, isDimmed, isOutsideBrush, setState } from "../state.js";
import { tween } from "../motion.js";
import { orderByRank } from "../data/countryColumns.js";
import { coverageLine, hideTooltip, showTooltip } from "../tooltip.js";
import { fitToSize } from "./fitToSize.js";
import { hitZones } from "./hitZones.js";

const MARGIN = { top: 76, right: 44, bottom: 40, left: 52 }; // top: the continent names (slanted)
const GAP = 2;          // between columns and between segments
const MIN_LABEL_H = 15; // smallest segment that fits a source name
const WIDE_COLUMN = 70; // narrower columns get a slanted name
const LABEL_SPACING = 13; // between slanted names
const MIN_HIT = 16;     // narrowest hover zone of a column

// Country level: bars + mix columns.
const RANK_MARGIN = { top: 18, right: 64, bottom: 24, left: 52 }; // right: the continent label
const SLANT_BOTTOM = 58; // bottom margin when the names are slanted
const SLANT_BELOW = 64; // narrower columns get a slanted name, so it is not cut
const SLANT_NAME = 84;  // longest slanted name
const MAX_BAND = 96;    // widest column, so Top 5 does not turn into blocks
const EXTRA_GAP = 16;   // before the compared countries outside the top N
const BARS_SHARE = 0.36; // of the height, for the bars
const NEUTRAL_BAR = "#8c8a83"; // bars of totals (no single source colour)
const VIEWS = [["compared", "Compared"], [5, "Top 5"], [10, "Top 10"]];
const VIEW_TITLES = {
  compared: "Only the compared countries (needs 2 or more)",
  5: "The 5 highest by the ranked value",
  10: "The 10 highest by the ranked value",
};

const FOSSIL_KEYS = ["coal", "oil", "gas"];
const RANK_GROUPS = [
  ["Totals", ["generation", "lowCarbon", "fossil"]],
  ["Fossil sources", FOSSIL_KEYS],
  ["Low-carbon sources", ["nuclear", "hydro", "wind", "solar", "bioOther"]],
];
const kindOf = (key) => (FOSSIL_KEYS.includes(key) ? "Fossil" : "Low-carbon");
const DARK_TEXT = ["solar", "gas", "nuclear", "wind"];
const CHAR_W = 6.2; // estimated label width per character
// Ranked by a group (Low-carbon, Fossil): the other sources are muted.
const isMuted = (rank, key) => rank.groups.length > 1 && !rank.groups.includes(key);
// A source name fits inside a segment of this height and width.
const fitsLabel = (seg, height, width, rank) => !isMuted(rank, seg.group.key)
  && height >= MIN_LABEL_H && width >= seg.group.label.length * CHAR_W + 10;

const format = (digits) => d3.format(`,.${digits}f`);
const formatTwh = (v) => format(v < 10 ? 1 : 0)(v);

// Shortens an SVG text to fit maxWidth, with an ellipsis; the tooltip has the full name.
function fitText(node, text, maxWidth) {
  node.textContent = text;
  let cut = text;
  while (cut.length > 1 && node.getComputedTextLength() > maxWidth) {
    cut = cut.slice(0, -1);
    node.textContent = `${cut.trimEnd()}…`;
  }
}

// The whole column, in legend order, with the source under the pointer in bold.
// Ranked by sources (Fossil, Coal...): those rows are bold, with their sum when there are several.
// Total generation: the source under the pointer is bold.
function columnTooltip(record, stat, current, rank, rankNote = "") {
  const bold = (key) => (rank.groups.length ? rank.groups.includes(key) : key === current);
  const rows = SOURCE_GROUPS.map((group) => {
    const twh = d3.sum(group.parts, (k) => record.sources[k]);
    const share = d3.sum(group.parts, (k) => record.shares[k]);
    return `<div class="tooltip-row${bold(group.key) ? " is-current" : ""}"><span>${group.label}</span>`
      + `<span>${format(0)(twh)} TWh (${format(1)(share)}%)</span></div>`;
  }).join("");
  const ranked = SOURCE_GROUPS.filter((g) => rank.groups.includes(g.key));
  const subtotal = ranked.length > 1
    ? `<div class="tooltip-row is-current"><span>${rank.label}</span><span>`
      + `${format(0)(d3.sum(ranked, (g) => d3.sum(g.parts, (k) => record.sources[k])))} TWh (`
      + `${format(1)(d3.sum(ranked, (g) => d3.sum(g.parts, (k) => record.shares[k])))}%)</span></div>`
    : "";
  const parts = SOURCE_GROUPS.find((g) => g.parts.length > 1).parts
    .map((k) => `${SOURCE_LABELS[k]} ${format(0)(record.sources[k])}`).join(", ");
  const ranking = rankNote ? `<div class="tooltip-note">${rankNote}</div>` : "";
  return `<strong>${record.name}, ${record.year}</strong>${ranking}${rows}${subtotal}`
    + `<div class="tooltip-row is-total"><span>Total</span><span>${format(0)(record.generation)} TWh</span></div>`
    + `<div class="tooltip-note">${parts} TWh</div>${coverageLine(stat, "year")}`;
}

// The x scale of the Marimekko is fixed across years (largest yearly world total), so wider
// columns show growth (U5).
export function createMarimekko(selector) {
  const x = d3.scaleLinear();
  const y = d3.scaleLinear().domain([0, 100]);
  let innerW = 0;
  let innerH = 0;
  let fullW = 0;
  let fullH = 0;
  let current = null;

  const root = d3.select(selector);
  // What to rank the columns by and in which direction (both levels); at the country level,
  // which countries to show.
  const tools = root.append("div").attr("class", "mekko-tools");
  const rankControl = tools.append("label");
  rankControl.append("span").text("Rank by");
  const rankSelect = rankControl.append("select")
    .on("change", (event) => setState({ mekkoRank: event.target.value }));
  // Grouped, so the fossil and low-carbon sources read as two sets (user test, T4).
  rankSelect.selectAll("optgroup").data(RANK_GROUPS).join("optgroup")
    .attr("label", ([label]) => label)
    .selectAll("option").data(([, keys]) => RANKS.filter((r) => keys.includes(r.key))).join("option")
    .attr("value", (d) => d.key)
    .text((d) => d.label);
  const sortButton = tools.append("button").attr("type", "button").attr("class", "sort-toggle")
    .on("click", () => setState({ mekkoSort: current?.[0].mekkoSort === "asc" ? "desc" : "asc" }));
  const viewGroup = tools.append("div");
  const viewButtons = viewGroup.attr("class", "segmented").attr("role", "group")
    .attr("aria-label", "Countries shown")
    .selectAll("button").data(VIEWS).join("button")
    .attr("type", "button")
    .text(([, label]) => label)
    .attr("title", ([n]) => VIEW_TITLES[n])
    .on("click", (_, [n]) => setState(n === "compared" ? { mekkoCompared: true } : { mekkoTop: n, mekkoCompared: false }));
  const legend = root.append("ul").attr("class", "legend");

  // Legend in stack order (ranked groups first). At the country level an entry ranks by its source.
  function renderLegend(order, rank, clickable) {
    const pick = (d) => setState({ mekkoRank: rank.groups.length === 1 && rank.key === d.key ? "generation" : d.key });
    // A "|" between the runs of fossil and low-carbon sources, so the two sets read apart on one line.
    const items = [];
    order.forEach((d, i) => {
      if (i > 0 && kindOf(order[i - 1].key) !== kindOf(d.key)) items.push({ heading: true, key: `h${i}` });
      items.push(d);
    });
    legend.selectAll("li.legend-heading").data(items.filter((d) => d.heading), (d) => d.key).join("li")
      .attr("class", "legend-heading")
      .attr("aria-hidden", true)
      .text("|");
    legend.selectAll("li:not(.legend-heading)").data(order, (d) => d.key).join((enter) => {
      const li = enter.append("li");
      li.append("span").attr("class", "swatch").style("background", (d) => d.color);
      li.append("span").text((d) => d.label);
      return li;
    });
    legend.selectAll("li").data(items, (d) => d.key).order();
    legend.selectAll("li:not(.legend-heading)")
      .classed("is-current", (d) => rank.groups.includes(d.key))
      .classed("is-clickable", clickable)
      .attr("role", clickable ? "button" : null)
      .attr("tabindex", clickable ? 0 : null)
      .attr("title", (d) => (clickable ? `Rank by ${d.label.toLowerCase()} (its share moves to the base)` : null))
      .on("click", clickable ? (_, d) => pick(d) : null)
      .on("keydown", clickable ? (event, d) => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); pick(d); }
      } : null);
  }

  const svg = root.append("svg")
    .attr("role", "img")
    .attr("aria-label", "Marimekko chart of the electricity mix by continent");
  const defs = svg.append("defs");
  defs.append("pattern")
    .attr("id", "mekko-hatch").attr("patternUnits", "userSpaceOnUse")
    .attr("width", 6).attr("height", 6).attr("patternTransform", "rotate(45)")
    .append("line").attr("x1", 0).attr("x2", 0).attr("y1", 0).attr("y2", 6)
    .attr("stroke", "#fcfcfb").attr("stroke-opacity", 0.7).attr("stroke-width", 1.5);

  // World: Marimekko of the continents.
  const plot = svg.append("g").attr("transform", `translate(${MARGIN.left}, ${MARGIN.top})`);
  const yAxis = plot.append("g").attr("class", "axis");
  const yTitle = svgUnitText(plot.append("text").attr("class", "axis-title").attr("text-anchor", "middle"),
    ["Share (", ["%", "%"], ")"]);
  const xAxis = plot.append("g").attr("class", "axis");
  const xTitle = svgUnitText(plot.append("text").attr("class", "axis-title").attr("text-anchor", "middle"),
    ["Generation (", ["TWh", "TWh"], ")"]);
  const columns = plot.append("g");
  const reference = plot.append("line").attr("class", "reference-line").attr("x1", 0);
  // Above the columns, so thin columns are easy to hover.
  const hits = plot.append("g");

  // Country level: bars of the ranked value above equal-width mix columns.
  const ranked = svg.append("g").attr("display", "none");
  const rBarsTitle = svgUnitText(ranked.append("text").attr("class", "axis-title").attr("text-anchor", "middle"),
    [["TWh", "TWh"]]);
  const rMixAxis = ranked.append("g").attr("class", "axis");
  const rMixTitle = svgUnitText(ranked.append("text").attr("class", "axis-title").attr("text-anchor", "middle"),
    ["Share (", ["%", "%"], ")"]);
  const rColumns = ranked.append("g");
  const rReference = ranked.append("line").attr("class", "reference-line");
  const rReferenceLabel = ranked.append("text").attr("class", "reference-label");
  const rEmpty = ranked.append("text").attr("class", "axis-title").attr("text-anchor", "middle");
  const rHits = ranked.append("g");

  function resize(width, height) {
    fullW = width;
    fullH = height;
    innerW = width - MARGIN.left - MARGIN.right;
    innerH = height - MARGIN.top - MARGIN.bottom;
    x.range([0, innerW]);
    y.range([innerH, 0]);

    yAxis.call(d3.axisLeft(y).tickValues([0, 25, 50, 75, 100]).tickFormat((d) => `${d}%`).tickSize(4))
      .call((g) => g.select(".domain").remove());
    yTitle.attr("transform", `translate(-40, ${innerH / 2}) rotate(-90)`);
    xTitle.attr("x", innerW / 2).attr("y", innerH + 34);
    reference.attr("x2", innerW).attr("y1", y(50)).attr("y2", y(50));
    if (current) render(...current);
  }

  // World: { records, stats, maxTotal } (one record per continent; maxTotal = the x domain).
  // Country level: { rank, ranking }, rank: entry of RANKS; ranking = { view, columns, max,
  // continentRecord }, view "compared" (the compared countries only) or "top" (the ranked top N).
  function render(s, options) {
    const { rank = RANKS[0], ranking = null } = options;
    const asc = s.mekkoSort === "asc";
    rankSelect.property("value", rank.key);
    sortButton.text(asc ? "↑ Smallest first" : "↓ Largest first")
      .attr("aria-label", asc ? "Sorted from the smallest; sort from the largest" : "Sorted from the largest; sort from the smallest");
    viewGroup.attr("hidden", ranking ? null : true);
    const order = sourceOrder(rank);
    renderLegend(order, rank, true);
    if (!ranking) {
      renderContinents(s, { ...options, rank, order });
      return;
    }
    const comparedCountries = s.compared.filter((k) => comparisonType(k) === "countries").length;
    const view = ranking.view === "compared" ? "compared" : s.mekkoTop;
    viewButtons.attr("aria-pressed", ([n]) => n === view)
      .property("disabled", ([n]) => n === "compared" && comparedCountries < 2)
      .text(([n, label]) => (n === "compared" && comparedCountries >= 2 ? `${label} (${comparedCountries})` : label));
    renderRanked(s, rank, order, ranking);
  }

  function renderContinents(s, { records: unsorted, stats, maxTotal, rank, order }) {
    const records = orderByRank(unsorted, rank, s.mekkoSort);
    plot.attr("display", null);
    ranked.attr("display", "none");
    x.domain([0, maxTotal]);
    xAxis.attr("transform", `translate(0, ${innerH})`)
      .call(d3.axisBottom(x).ticks(Math.max(2, Math.floor(innerW / 70))).tickFormat(d3.format(",")).tickSize(4));
    svg.attr("aria-label", "Marimekko chart of the electricity mix by continent");

    let start = 0;
    let lastLabel = -Infinity;
    const layout = records.map((record) => {
      let top = 0;
      const segments = order.map((g) => {
        const share = d3.sum(g.parts, (k) => record.shares[k]);
        const segment = { group: g, y0: top, y1: top + share };
        top += share;
        return segment;
      });
      const x0 = x(start);
      const width = x(start + record.generation) - x0;
      const center = x0 + width / 2;
      const labelShift = Math.max(0, lastLabel + LABEL_SPACING - center);
      lastLabel = center + labelShift;
      start += record.generation;
      return { record, x0, width, segments, labelShift, id: record.key };
    });
    const widest = d3.greatest(layout, (d) => d.width)?.record.key;

    const groups = columns.selectAll("g.column").data(layout, (d) => d.id).join((enter) => {
      const g = enter.append("g").attr("class", "column");
      g.append("text").attr("class", "column-label");
      g.append("rect").attr("class", "column-hatch").attr("fill", "url(#mekko-hatch)");
      g.append("rect").attr("class", "column-outline");
      return g;
    });

    const shown = layout.map((d) => d.record.key);
    groups
      .classed("is-compared", (d) => s.compared.includes(d.record.key))
      .classed("is-dimmed", (d) => isDimmed(d.record.key, s, shown))
      .classed("is-hovered", (d) => d.record.key === s.hovered);
    tween(groups, s).attr("transform", (d) => `translate(${d.x0}, 0)`);

    const columnWidth = (d) => Math.max(1, d.width - GAP);
    groups.select(".column-label")
      .text((d) => (s.compared.includes(d.record.key) ? `✓ ${d.record.name}` : d.record.name))
      .attr("text-anchor", "start")
      .attr("transform", (d) => (d.width >= WIDE_COLUMN
        ? "translate(0, -6)"
        : `translate(${d.width / 2 + d.labelShift}, -6) rotate(-65)`));
    tween(groups.select(".column-hatch"), s)
      .attr("width", columnWidth)
      .attr("height", innerH)
      .attr("display", (d) => (stats.get(d.record.key).partial ? null : "none"));

    groups.selectAll("rect.segment")
      .data((d) => d.segments.map((segment) => ({ ...segment, column: d })), (d) => d.group.key)
      .join((enter) => enter.append("rect").attr("y", innerH).attr("height", 0)) // new columns grow up
      .attr("class", "segment")
      .classed("is-muted", (d) => isMuted(rank, d.group.key))
      .attr("fill", (d) => d.group.color)
      .call((sel) => tween(sel, s)
        .attr("y", (d) => y(d.y1))
        .attr("width", (d) => columnWidth(d.column))
        .attr("height", (d) => Math.max(0, y(d.y0) - y(d.y1) - (d.y1 - d.y0 > 1 ? GAP : 0))));
    groups.select(".column-hatch").raise();
    groups.select(".column-outline").raise();
    tween(groups.select(".column-outline"), s).attr("width", columnWidth).attr("height", innerH);

    // Direct labels on every segment where the name fits (the widest column always tries), so the
    // sources can be read without the legend (user test, T2).
    groups.selectAll("text.segment-label")
      .data((d) => d.segments
        .filter((seg) => fitsLabel(seg, y(seg.y0) - y(seg.y1), columnWidth(d), rank) || (d.record.key === widest && rank.key === "generation"
          && y(seg.y0) - y(seg.y1) >= MIN_LABEL_H && !isMuted(rank, seg.group.key)))
        .map((seg) => ({ ...seg, column: d })), (d) => d.group.key)
      .join("text")
      .attr("class", "segment-label")
      .attr("x", 6)
      .attr("y", (d) => (y(d.y0) + y(d.y1)) / 2)
      .attr("dy", "0.32em")
      .attr("fill", (d) => (DARK_TEXT.includes(d.group.key) ? "#0b0b0b" : "#ffffff"))
      .text((d) => d.group.label);

    const zones = hitZones(layout.map((d) => [d.x0, d.x0 + d.width]), MIN_HIT);
    hits.selectAll("rect").data(layout, (d) => d.id).join("rect")
      .attr("class", "hit-area is-clickable")
      .attr("x", (_, i) => zones[i][0])
      .attr("width", (_, i) => zones[i][1] - zones[i][0])
      .attr("y", 0)
      .attr("height", innerH)
      .on("click", (event, d) => openEntityMenu(event, d.record.key, d.record.name))
      .on("mouseenter", (_, d) => setState({ hovered: d.record.key }))
      .on("mousemove", (event, d) => {
        const share = y.invert(d3.pointer(event, plot.node())[1]);
        const source = d.segments.find((seg) => share >= seg.y0 && share < seg.y1)?.group.key;
        showTooltip(event, columnTooltip(d.record, stats.get(d.record.key), source, rank));
      })
      .on("mouseleave", () => { setState({ hovered: null }); hideTooltip(); });
  }

  // The Marimekko split in two aligned charts: bars of the ranked value (TWh, one scale over the
  // years) and, under each bar, an equal-width column of the mix with the ranked sources at the
  // base, so their shares are compared on a common baseline. Names are slanted when the columns
  // are narrow. The compared countries outside the top N follow after a gap. Dashed line = the
  // continent's share of the ranked sources.
  // view "compared": only the compared countries (any continent), so none is outlined or marked.
  function renderRanked(s, rank, order, { view, columns: shownColumns, max, continentRecord }) {
    plot.attr("display", "none");
    ranked.attr("display", null);
    const { extra, stats, position } = shownColumns;
    // The top N is always the highest N; the direction only changes the order shown.
    const records = s.mekkoSort === "asc" ? [...shownColumns.records].reverse() : shownColumns.records;
    const onlyCompared = view === "compared";
    const all = [...records, ...extra];
    const w = fullW - RANK_MARGIN.left - RANK_MARGIN.right;
    const gapBefore = extra.length && records.length ? EXTRA_GAP : 0;
    const band = Math.min(MAX_BAND, (w - gapBefore) / Math.max(1, all.length));
    const slanted = band < SLANT_BELOW;
    const h = fullH - RANK_MARGIN.top - (slanted ? SLANT_BOTTOM : RANK_MARGIN.bottom);
    ranked.attr("transform", `translate(${RANK_MARGIN.left}, ${RANK_MARGIN.top})`);
    const barsH = Math.round(h * BARS_SHARE);
    const mixTop = barsH + 10;
    const mixBottom = h;

    const yBar = d3.scaleLinear().domain([0, max || 1]).range([barsH, 0]);
    const yMix = d3.scaleLinear().domain([0, 100]).range([mixBottom, mixTop]);
    const barColor = rank.color ?? NEUTRAL_BAR;
    svg.attr("aria-label", onlyCompared
      ? `Bar chart of the ${records.length} compared countries by ${rank.name}, with their electricity mix`
      : `Bar chart of the top ${records.length} countries of ${s.continent} by ${rank.name}, with their electricity mix`);

    rBarsTitle.attr("transform", `translate(-40, ${barsH / 2}) rotate(-90)`);
    rMixAxis.call(d3.axisLeft(yMix).tickValues([0, 50, 100]).tickFormat((d) => `${d}%`).tickSize(4))
      .call((g) => g.select(".domain").remove());
    rMixTitle.attr("transform", `translate(-40, ${(mixTop + mixBottom) / 2}) rotate(-90)`);
    rEmpty.attr("x", w / 2).attr("y", (mixTop + mixBottom) / 2)
      .text(all.length ? "" : onlyCompared ? `No compared country has data in ${s.year}`
        : `No country of ${s.continent} has ${rank.name} in ${s.year}`);

    const layout = all.map((record, i) => {
      let base = 0;
      const segments = order.map((g) => {
        const share = d3.sum(g.parts, (k) => record.shares[k]);
        const segment = { group: g, y0: base, y1: base + share };
        base += share;
        return segment;
      });
      const x0 = i * band + (i >= records.length ? gapBefore : 0);
      return { record, x0, segments, value: rank.value(record), id: record.key };
    });

    // The continent's share of the ranked sources, as a reference for the mix columns (not when
    // the compared countries come from other continents).
    const sameContinent = all.every((r) => r.continent === s.continent);
    const share = rank.groups.length && continentRecord && sameContinent
      ? d3.sum(SOURCE_GROUPS.filter((g) => rank.groups.includes(g.key)), (g) => d3.sum(g.parts, (k) => continentRecord.shares[k]))
      : null;
    const end = layout.length ? layout.at(-1).x0 + band - GAP : 0;
    rReference.attr("display", share === null || !layout.length ? "none" : null)
      .attr("x1", 0).attr("x2", end).attr("y1", yMix(share ?? 0)).attr("y2", yMix(share ?? 0));
    rReferenceLabel.attr("display", share === null || !layout.length ? "none" : null)
      .attr("x", end + 4)
      .attr("y", yMix(share ?? 0) + 4)
      .text(share === null ? "" : `${s.continent} ${format(0)(share)}%`);

    // New columns appear in place with an empty bar; kept columns slide to their new rank.
    const groups = rColumns.selectAll("g.column").data(layout, (d) => d.id).join((enter) => {
      const g = enter.append("g").attr("class", "column").attr("transform", (d) => `translate(${d.x0}, 0)`);
      g.append("rect").attr("class", "rank-bar").attr("y", barsH).attr("height", 0);
      g.append("text").attr("class", "rank-value");
      g.append("rect").attr("class", "column-hatch").attr("fill", "url(#mekko-hatch)");
      g.append("rect").attr("class", "column-outline");
      g.append("text").attr("class", "rank-name");
      return g;
    });
    const shown = layout.map((d) => d.record.key);
    const columnWidth = Math.max(1, band - GAP);
    tween(groups, s).attr("transform", (d) => `translate(${d.x0}, 0)`);
    groups
      .classed("is-compared", (d) => !onlyCompared && s.compared.includes(d.record.key))
      .classed("is-dimmed", (d) => (!onlyCompared && isDimmed(d.record.key, s, shown)) || isOutsideBrush([d.record.key], s))
      .classed("is-hovered", (d) => d.record.key === s.hovered);
    tween(groups.select(".rank-bar"), s)
      .attr("width", columnWidth)
      .attr("y", (d) => yBar(d.value))
      .attr("height", (d) => Math.max(0, barsH - yBar(d.value)))
      .attr("fill", barColor);
    let lastValue = { right: -Infinity, top: -Infinity };
    groups.order().select(".rank-value")
      .attr("x", columnWidth / 2)
      .attr("y", (d) => yBar(d.value) - 4)
      // Only where it fits: at most a little wider than its bar and clear of the previous value
      // shown (similar values sit at the same height); the tooltip has every value.
      .each(function (d) {
        this.textContent = formatTwh(d.value);
        const half = this.getComputedTextLength() / 2;
        const center = d.x0 + columnWidth / 2;
        const top = yBar(d.value) - 4;
        const clear = center - half > lastValue.right + 3 || Math.abs(top - lastValue.top) > 12;
        if (half * 2 > band + 8 || !clear) this.textContent = "";
        else lastValue = { right: center + half, top };
      });
    groups.selectAll("rect.segment")
      .data((d) => d.segments.map((segment) => ({ ...segment, column: d })), (d) => d.group.key)
      .join("rect")
      .attr("class", "segment")
      .classed("is-muted", (d) => isMuted(rank, d.group.key))
      .attr("fill", (d) => d.group.color)
      .call((sel) => tween(sel, s)
        .attr("y", (d) => yMix(d.y1))
        .attr("width", columnWidth)
        .attr("height", (d) => Math.max(0, yMix(d.y0) - yMix(d.y1) - (d.y1 - d.y0 > 1 ? GAP : 0))));
    groups.selectAll("text.segment-label")
      .data((d) => d.segments.filter((seg) => fitsLabel(seg, yMix(seg.y0) - yMix(seg.y1), columnWidth, rank)), (d) => d.group.key)
      .join("text")
      .attr("class", "segment-label")
      .attr("x", 4)
      .attr("y", (d) => (yMix(d.y0) + yMix(d.y1)) / 2)
      .attr("dy", "0.32em")
      .attr("fill", (d) => (DARK_TEXT.includes(d.group.key) ? "#0b0b0b" : "#ffffff"))
      .text((d) => d.group.label);
    groups.select(".column-hatch")
      .attr("y", mixTop)
      .attr("width", columnWidth)
      .attr("height", mixBottom - mixTop)
      .attr("display", (d) => (stats.get(d.record.key).partial ? null : "none"))
      .raise();
    groups.select(".column-outline")
      .attr("y", mixTop)
      .attr("width", columnWidth)
      .attr("height", mixBottom - mixTop)
      .raise();
    groups.select(".rank-name")
      .classed("is-slanted", slanted)
      .attr("x", 0)
      .attr("y", 0)
      .attr("transform", slanted
        ? `translate(${columnWidth / 2 + 4}, ${mixBottom + 8}) rotate(-40)`
        : `translate(${columnWidth / 2}, ${mixBottom + 15})`)
      .each(function (d) {
        const name = !onlyCompared && s.compared.includes(d.record.key) ? `✓ ${d.record.name}` : d.record.name;
        fitText(this, name, slanted ? SLANT_NAME : band - 2);
      });

    const rankNote = (d) => `#${position.get(d.record.key)} in ${d.record.continent} by ${rank.name}`
      + (rank.key === "generation" ? "" : ` (${formatTwh(d.value)} TWh)`);
    rHits.selectAll("rect").data(layout, (d) => d.id).join("rect")
      .attr("class", "hit-area is-clickable")
      .attr("x", (d) => d.x0)
      .attr("width", band)
      .attr("y", 0)
      .attr("height", mixBottom + 20)
      .on("click", (event, d) => openEntityMenu(event, d.record.key, d.record.name))
      .on("mouseenter", (_, d) => setState({ hovered: d.record.key }))
      .on("mousemove", (event, d) => {
        const pointerShare = yMix.invert(d3.pointer(event, ranked.node())[1]);
        const source = d.segments.find((seg) => pointerShare >= seg.y0 && pointerShare < seg.y1)?.group.key;
        showTooltip(event, columnTooltip(d.record, stats.get(d.record.key), source, rank, rankNote(d)));
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
