// Landing page: the question, three numbers and two small charts. Reads the small
// data/summary.json (scripts/build-summary.mjs), not the 70 MB CSV the app loads.
// Motion: numbers count up, sections fade in as they scroll into view, lines draw in once.
// All of it is skipped under prefers-reduced-motion.

import { CONTINENT_COLORS } from "./scales.js";
import { createParadox } from "./charts/paradox.js";
import { fitToSize } from "./charts/fitToSize.js";
import { drawLineIn, prefersReducedMotion } from "./motion.js";
import { hideTooltip, showTooltip } from "./tooltip.js";

const SUMMARY_URL = "../data/summary.json";
const reduced = prefersReducedMotion();
const COUNT_MS = 1400;
const pct = d3.format("+.0f");
const change = (from, to) => (100 * (to - from)) / from; // % change since the first year

// A number that counts up from its start value; text(v) formats it.
function countUp(node, from, to, text) {
  if (reduced) { node.textContent = text(to); return; }
  d3.select(node).transition().duration(COUNT_MS).ease(d3.easeCubicOut)
    .tween("text", () => { const i = d3.interpolateNumber(from, to); return (t) => { node.textContent = text(i(t)); }; });
}

// Sections fade and rise in once, when a quarter of them is visible.
function revealOnScroll(onShow) {
  const sections = document.querySelectorAll(".reveal");
  if (reduced || !("IntersectionObserver" in window)) {
    sections.forEach((el) => { el.classList.add("is-visible"); onShow(el); });
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-visible");
      onShow(entry.target);
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.25 });
  // Hidden only once the script runs, so without it (or in a full-page capture) nothing is lost.
  sections.forEach((el) => { el.classList.add("is-pending"); observer.observe(el); });
}

function heroStats(world) {
  const [a, b] = [world[0], world.at(-1)];
  const stats = [
    { from: a.renewableShare, to: b.renewableShare, text: (v) => `${d3.format(".0f")(v)}%`,
      start: `${d3.format(".0f")(a.renewableShare)}% → `, note: `renewable electricity (${a.year} → ${b.year})` },
    { from: 0, to: change(a.generation, b.generation), text: (v) => `${pct(v)}%`, note: "electricity generated" },
    { from: 0, to: change(a.emissions, b.emissions), text: (v) => `${pct(v)}%`, note: "CO₂e from electricity" },
  ];
  const items = d3.select("#hero-stats").selectAll("li").data(stats).join("li");
  items.append("strong").each(function (d) {
    d3.select(this).append("span").text(d.start ?? "");
    const value = d3.select(this).append("span").node();
    countUp(value, d.from, d.to, d.text);
  });
  items.append("span").text((d) => d.note);
}

// Europe vs Asia (and the World), CO₂e as % change since 2000; lines draw in when shown.
function storiesChart(summary) {
  const series = [
    { key: "Asia", rows: summary.continents.Asia, color: CONTINENT_COLORS.Asia },
    { key: "World", rows: summary.world, color: "#52514e", dash: "4 3" },
    { key: "Europe", rows: summary.continents.Europe, color: CONTINENT_COLORS.Europe },
  ].map((s) => ({ ...s, points: s.rows.filter((r) => r.emissions !== null).map((r) => ({ year: r.year, value: change(s.rows[0].emissions, r.emissions), raw: r.emissions })) }));
  const margin = { top: 12, right: 100, bottom: 24, left: 50 };
  const svg = d3.select("#chart-stories").append("svg").attr("role", "img")
    .attr("aria-label", "CO₂e from electricity, % change since 2000: Asia more than tripled, the World rose by 81%, Europe fell by about a third.");
  let shown = false;    // the section has scrolled into view
  let animated = false; // the lines drew in once
  let draw = null;      // set once the chart has a size
  const drawNow = () => { if (shown && draw) { draw(!animated && !reduced); animated = true; } };
  fitToSize(svg, (width, height) => {
    draw = (animate) => {
      svg.selectAll("*").remove();
      const w = width - margin.left - margin.right;
      const h = height - margin.top - margin.bottom;
      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
      const x = d3.scaleLinear().domain(summary.years).range([0, w]);
      const y = d3.scaleLinear().domain([d3.min(series, (s) => d3.min(s.points, (p) => p.value)), d3.max(series, (s) => d3.max(s.points, (p) => p.value))]).nice(4).range([h, 0]);
      g.append("g").attr("class", "axis").attr("transform", `translate(0,${h})`)
        .call(d3.axisBottom(x).tickValues([2000, 2008, 2016, 2024]).tickFormat(d3.format("d")).tickSizeOuter(0));
      g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(4).tickFormat((v) => (v === 0 ? "0%" : `${pct(v)}%`)).tickSizeOuter(0));
      g.append("line").attr("class", "reference-line").attr("x1", 0).attr("x2", w).attr("y1", y(0)).attr("y2", y(0));
      for (const s of series) {
        const path = g.append("path").datum(s.points).attr("fill", "none").attr("stroke", s.color)
          .attr("stroke-width", 2.5).attr("stroke-dasharray", s.dash ?? null)
          .attr("d", d3.line((p) => x(p.year), (p) => y(p.value)));
        if (animate && !s.dash) drawLineIn(path, 1400);
        const end = s.points.at(-1);
        g.append("text").attr("class", "paradox-label").attr("x", w + 6).attr("y", y(end.value)).attr("dy", "0.32em")
          .attr("fill", s.color).text(`${s.key} ${pct(end.value)}%`);
      }
      const cursor = g.append("line").attr("class", "crosshair").attr("y1", 0).attr("y2", h).attr("visibility", "hidden");
      g.append("rect").attr("class", "hit-area").attr("width", w).attr("height", h)
        .on("mousemove", (event) => {
          const year = Math.round(x.invert(d3.pointer(event)[0]));
          cursor.attr("visibility", "visible").attr("x1", x(year)).attr("x2", x(year));
          showTooltip(event, `<strong>CO₂e from electricity, ${year}</strong>`
            + series.map((s) => { const p = s.points.find((d) => d.year === year); return p ? `<div class="tooltip-row"><span>${s.key}</span><span>${d3.format(",.0f")(p.raw)} Mt · ${pct(p.value)}%</span></div>` : ""; }).join(""));
        })
        .on("mouseleave", () => { cursor.attr("visibility", "hidden"); hideTooltip(); });
    };
    drawNow();
  });
  return () => { shown = true; drawNow(); };
}

async function init() {
  const summary = await d3.json(SUMMARY_URL);
  d3.select("#fact-countries").text(summary.countries);
  heroStats(summary.world);
  createParadox("#chart-paradox", { world: summary.world });
  const showStories = storiesChart(summary);
  revealOnScroll((el) => { if (el.querySelector("#chart-stories")) showStories(); });
}

init();
