// View B: one bubble per country of the continent in the selected year. x = emissions per
// person (log), y = carbon intensity, area = total emissions, colour = renewable share.
// Base examples: The Wealth & Health of Nations (https://observablehq.com/@mbostock/the-wealth-health-of-nations)
// and Brushable scatterplot (https://observablehq.com/@d3/brushable-scatterplot).

import { COMPLETE_YEARS } from "../data/constants.js";
import { openEntityMenu } from "../entityMenu.js";
import { NO_DATA, metricColor } from "../scales.js";
import { setState } from "../state.js";
import { hideTooltip, showTooltip } from "../tooltip.js";
import { fitToSize } from "./fitToSize.js";

const MARGIN = { top: 14, right: 28, bottom: 40, left: 58 };
const TOP_LABELS = 5;   // largest emitters named; compared and hovered countries always are
const HOVER_PAD = 10;   // hover zone beyond a bubble's edge
const MIN_R = 3;        // smallest bubble, so small emitters stay visible
const LABEL_H = 12;
const CHAR_W = 6.2;     // estimated label width per character, to skip overlapping names

const colorOf = metricColor("renewableShare", "year");
const valid = (r) => r && r.emissionsPerCapita > 0 && r.carbonIntensity !== null && r.emissions > 0;
const fmt = (digits) => d3.format(`,.${digits}f`);

function tooltipHtml(r) {
  const row = (label, value) => `<div class="tooltip-row"><span>${label}</span><span>${value}</span></div>`;
  return `<strong>${r.name}, ${r.year}</strong>`
    + row("Emissions per person", `${fmt(2)(r.emissionsPerCapita)} t CO₂e`)
    + row("Carbon intensity", `${fmt(0)(r.carbonIntensity)} gCO₂/kWh`)
    + row("Total emissions", `${fmt(1)(r.emissions)} Mt CO₂e`)
    + row("Renewable share", r.renewableShare === null ? "no data" : `${fmt(1)(r.renewableShare)}%`)
    + `<div class="tooltip-note">From electricity generation. Click for details or + Compare</div>`;
}

export function createBubbleScatter(selector, { countries, world, countriesOf }) {
  const byCountry = d3.index(countries, (r) => r.key, (r) => r.year);
  const byWorld = d3.index(world, (r) => r.year);
  const x = d3.scaleLog();
  const y = d3.scaleLinear();
  const radius = d3.scaleSqrt();
  const domains = new Map(); // continent → fixed domains over 2000–2024, so movement means change

  const root = d3.select(selector);
  const note = root.append("p").attr("class", "how-to-read scatter-note").attr("role", "status");
  const legend = root.append("ul").attr("class", "legend");
  const ramp = legend.append("li");
  ramp.append("span").text("Renewable share 0%");
  ramp.append("span").attr("class", "ramp")
    .style("background", `linear-gradient(to right, ${d3.range(0, 1.01, 0.1).map((t) => colorOf(100 * t)).join(", ")})`);
  ramp.append("span").text("100%");
  legend.append("li").html(`<span class="swatch swatch-ring"></span>Area = total emissions`);
  legend.append("li").html(`<span class="swatch swatch-dash"></span>World`);

  const svg = root.append("svg").attr("role", "img");
  const plot = svg.append("g").attr("transform", `translate(${MARGIN.left}, ${MARGIN.top})`);
  const xAxis = plot.append("g").attr("class", "axis");
  const yAxis = plot.append("g").attr("class", "axis");
  const xTitle = plot.append("text").attr("class", "axis-title").attr("text-anchor", "middle")
    .text("Emissions per person (t CO₂e, log scale)");
  const yTitle = plot.append("text").attr("class", "axis-title").attr("text-anchor", "middle")
    .text("Carbon intensity (gCO₂/kWh)");
  const worldX = plot.append("line").attr("class", "reference-line");
  const worldY = plot.append("line").attr("class", "reference-line");
  const worldLabel = plot.append("text").attr("class", "axis-title").text("World");
  const trails = plot.append("g");
  const bubbles = plot.append("g");
  const labels = plot.append("g");
  const overlay = plot.append("rect").attr("class", "hit-area is-clickable");

  let innerW = 0;
  let innerH = 0;
  let current = null;
  let hoveredKey = null;

  function domainsOf(continent) {
    if (!domains.has(continent)) {
      const records = (countriesOf.get(continent) ?? []).flatMap((k) => [...(byCountry.get(k)?.values() ?? [])])
        .filter((r) => valid(r) && r.year >= COMPLETE_YEARS[0] && r.year <= COMPLETE_YEARS[1]);
      domains.set(continent, {
        x: d3.extent(records, (r) => r.emissionsPerCapita),
        y: [0, d3.max(records, (r) => r.carbonIntensity)],
        r: [0, d3.max(records, (r) => r.emissions)],
      });
    }
    return domains.get(continent);
  }

  function resize(width, height) {
    innerW = width - MARGIN.left - MARGIN.right;
    innerH = height - MARGIN.top - MARGIN.bottom;
    x.range([0, innerW]);
    y.range([innerH, 0]);
    radius.range([0, Math.max(12, Math.min(40, Math.min(innerW, innerH) / 8))]);
    overlay.attr("width", innerW).attr("height", innerH);
    xTitle.attr("x", innerW / 2).attr("y", innerH + 34);
    yTitle.attr("transform", `translate(-44, ${innerH / 2}) rotate(-90)`);
    if (current) render(current);
  }

  function render(s) {
    const d = domainsOf(s.continent);
    x.domain(d.x).nice();
    y.domain(d.y).nice();
    radius.domain(d.r);
    const keys = countriesOf.get(s.continent) ?? [];
    const points = keys.map((k) => byCountry.get(k)?.get(s.year)).filter(valid)
      .sort((a, b) => b.emissions - a.emissions)
      .map((r) => ({ r, cx: x(r.emissionsPerCapita), cy: y(r.carbonIntensity), rr: Math.max(MIN_R, radius(r.emissions)) }));
    const withGeneration = keys.filter((k) => byCountry.get(k)?.get(s.year)?.generation > 0).length;

    note.text(s.year < COMPLETE_YEARS[0]
      ? `No emissions data before ${COMPLETE_YEARS[0]}. Move the year slider to ${COMPLETE_YEARS[0]} or later.`
      : withGeneration > points.length ? `${withGeneration - points.length} of ${withGeneration} countries have no emissions data in ${s.year}.` : "");
    svg.attr("aria-label", `Bubble scatter of ${points.length} countries of ${s.continent} in ${s.year}: emissions per person, carbon intensity and total emissions.`);

    xAxis.attr("transform", `translate(0, ${innerH})`)
      .call(d3.axisBottom(x).ticks(Math.max(3, innerW / 90), "~g").tickSize(4));
    yAxis.call(d3.axisLeft(y).ticks(Math.max(3, innerH / 50)).tickSize(4))
      .call((g) => g.select(".domain").remove());

    const w = byWorld.get(s.year);
    const showWorld = valid(w);
    worldX.attr("display", showWorld ? null : "none");
    worldY.attr("display", showWorld ? null : "none");
    worldLabel.attr("display", showWorld ? null : "none");
    if (showWorld) {
      const wx = x(w.emissionsPerCapita);
      const wy = y(w.carbonIntensity);
      worldX.attr("x1", wx).attr("x2", wx).attr("y1", 0).attr("y2", innerH);
      worldY.attr("x1", 0).attr("x2", innerW).attr("y1", wy).attr("y2", wy);
      worldLabel.attr("x", wx + 4).attr("y", 10);
    }

    // Path of each compared country over the range, from a hollow start dot to its bubble.
    const comparedHere = s.mode === "year" ? [] : s.compared.filter((k) => keys.includes(k));
    const trailData = comparedHere.map((key) => ({
      key,
      path: d3.range(s.rangeStart, s.year + 1).map((yr) => byCountry.get(key)?.get(yr)).filter(valid),
    })).filter((t) => t.path.length > 1);
    const trail = trails.selectAll("g.trail").data(trailData, (t) => t.key).join((enter) => {
      const g = enter.append("g").attr("class", "trail");
      g.append("path");
      g.append("circle").attr("r", 3);
      return g;
    });
    trail.select("path").attr("d", (t) => d3.line((r) => x(r.emissionsPerCapita), (r) => y(r.carbonIntensity))(t.path));
    trail.select("circle").attr("cx", (t) => x(t.path[0].emissionsPerCapita)).attr("cy", (t) => y(t.path[0].carbonIntensity));

    bubbles.selectAll("circle").data(points, (p) => p.r.key).join("circle")
      .attr("class", "bubble")
      .attr("cx", (p) => p.cx).attr("cy", (p) => p.cy).attr("r", (p) => p.rr)
      .attr("fill", (p) => (p.r.renewableShare === null ? NO_DATA : colorOf(p.r.renewableShare)))
      .classed("is-compared", (p) => s.compared.includes(p.r.key))
      .classed("is-hovered", (p) => p.r.key === s.hovered);
    // Marked bubbles on top, so their outline is never covered.
    bubbles.selectAll("circle.is-compared, circle.is-hovered").raise();

    // Names: hovered, compared, then the largest emitters, skipping any that would overlap.
    const ranked = [
      ...points.filter((p) => p.r.key === s.hovered),
      ...points.filter((p) => s.compared.includes(p.r.key) && p.r.key !== s.hovered),
      ...points.slice(0, TOP_LABELS).filter((p) => !s.compared.includes(p.r.key) && p.r.key !== s.hovered),
    ];
    const boxes = [];
    const named = ranked.filter((p, i) => {
      const text = s.compared.includes(p.r.key) ? `✓ ${p.r.name}` : p.r.name;
      const bx = p.cx + p.rr + 3;
      const box = { x0: bx, x1: bx + text.length * CHAR_W, y0: p.cy - LABEL_H / 2, y1: p.cy + LABEL_H / 2, text };
      if (box.x1 > innerW) { box.x1 = p.cx - p.rr - 3; box.x0 = box.x1 - text.length * CHAR_W; box.end = true; }
      const free = !boxes.some((b) => b.x0 < box.x1 && box.x0 < b.x1 && b.y0 < box.y1 && box.y0 < b.y1);
      const forced = p.r.key === s.hovered || s.compared.includes(p.r.key);
      if (!free && !forced) return false;
      boxes.push(box);
      p.box = box;
      return true;
    });
    labels.selectAll("text").data(named, (p) => p.r.key).join("text")
      .attr("class", (p) => `bubble-label${s.compared.includes(p.r.key) ? " is-compared" : ""}`)
      .attr("x", (p) => (p.box.end ? p.box.x1 : p.box.x0))
      .attr("y", (p) => p.cy)
      .attr("dy", "0.32em")
      .attr("text-anchor", (p) => (p.box.end ? "end" : "start"))
      .text((p) => p.box.text);

    // One hover layer: the nearest bubble within its radius + HOVER_PAD, so small bubbles under
    // big ones can still be reached.
    const delaunay = d3.Delaunay.from(points, (p) => p.cx, (p) => p.cy);
    const nearest = (event) => {
      if (!points.length) return null;
      const [mx, my] = d3.pointer(event, plot.node());
      const p = points[delaunay.find(mx, my)];
      return Math.hypot(p.cx - mx, p.cy - my) <= p.rr + HOVER_PAD ? p : null;
    };
    overlay
      .on("mousemove", (event) => {
        const p = nearest(event);
        const key = p?.r.key ?? null;
        if (key !== hoveredKey) { hoveredKey = key; setState({ hovered: key }); }
        if (p) showTooltip(event, tooltipHtml(p.r));
        else hideTooltip();
        overlay.style("cursor", p ? "pointer" : null);
      })
      .on("mouseleave", () => { hoveredKey = null; setState({ hovered: null }); hideTooltip(); })
      .on("click", (event) => {
        const p = nearest(event);
        if (p) openEntityMenu(event, p.r.key, p.r.name);
      });
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
