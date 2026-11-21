// Findings page: the evaluation results, read from data/sus-results.json (anonymous). SUS scores
// are computed here from the raw answers, with the standard rule: odd items (answer − 1), even
// items (5 − answer), sum × 2.5. Until the tests run, the file is empty and the page says so.

import { fitToSize } from "./charts/fitToSize.js";
import { hideTooltip, showTooltip } from "./tooltip.js";
import { SUS_AVERAGE, susScore } from "./data/sus.js";

const RESULTS_URL = "../data/sus-results.json";

function pending(selector, text) {
  d3.select(selector).append("p").attr("class", "pending").text(text);
}

function heuristicsTable(rows) {
  if (!rows.length) return pending("#heuristics", "Results after the heuristic evaluation (both authors, then merged).");
  const table = d3.select("#heuristics").append("table").attr("class", "results-table");
  table.append("thead").append("tr").selectAll("th").data(["Heuristic", "Problems", "Worst severity"]).join("th").text((d) => d);
  table.append("tbody").selectAll("tr").data(rows).join("tr").selectAll("td")
    .data((r) => [`${r.id} ${r.name}`, r.problems, r.maxSeverity ?? "–"]).join("td").text((d) => d);
}

// One dot per participant on the 0-100 scale, the mean as a bar, and the average (68) as a line.
function susChart(people) {
  const margin = { top: 18, right: 16, bottom: 28, left: 16 };
  const svg = d3.select("#chart-sus").append("svg").attr("role", "img");
  const mean = d3.mean(people, (p) => p.score);
  svg.attr("aria-label", `SUS scores of ${people.length} participants, mean ${d3.format(".1f")(mean)}; the average SUS score is ${SUS_AVERAGE}.`);
  fitToSize(svg, (width, height) => {
    svg.selectAll("*").remove();
    const w = width - margin.left - margin.right;
    const cy = (height - margin.top - margin.bottom) / 2;
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const x = d3.scaleLinear().domain([0, 100]).range([0, w]);
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${2 * cy})`)
      .call(d3.axisBottom(x).ticks(5).tickSizeOuter(0));
    g.append("line").attr("class", "reference-line").attr("x1", x(SUS_AVERAGE)).attr("x2", x(SUS_AVERAGE)).attr("y1", 0).attr("y2", 2 * cy);
    g.append("text").attr("class", "axis-title").attr("x", x(SUS_AVERAGE)).attr("y", -6).attr("text-anchor", "middle").text(`average ${SUS_AVERAGE}`);
    g.append("line").attr("class", "sus-mean").attr("x1", x(mean)).attr("x2", x(mean)).attr("y1", cy - 14).attr("y2", cy + 14);
    g.append("text").attr("class", "paradox-label").attr("x", x(mean) + 6).attr("y", cy - 16).text(`mean ${d3.format(".1f")(mean)}`);
    g.selectAll("circle").data(people).join("circle").attr("class", "sus-dot")
      .attr("cx", (p) => x(p.score)).attr("cy", (p, i) => cy + ((i % 3) - 1) * 6).attr("r", 5)
      .on("mousemove", (event, p) => showTooltip(event, `<strong>${p.id}</strong><div class="tooltip-row"><span>SUS</span><span>${d3.format(".1f")(p.score)}</span></div>`))
      .on("mouseleave", hideTooltip);
  });
}

function susTable(people) {
  const table = d3.select("#sus-table").append("table").attr("class", "results-table");
  table.append("thead").append("tr").selectAll("th").data(["Participant", "SUS score"]).join("th").text((d) => d);
  table.append("tbody").selectAll("tr").data(people).join("tr").selectAll("td")
    .data((p) => [p.id, d3.format(".1f")(p.score)]).join("td").text((d) => d);
}

async function init() {
  const results = await d3.json(RESULTS_URL);
  heuristicsTable(results.heuristics ?? []);
  const people = (results.sus ?? []).map((p, i) => ({ id: p.id ?? `P${i + 1}`, score: susScore(p.answers) }))
    .filter((p) => p.score !== null);
  if (!people.length) {
    d3.select("#chart-sus").remove();
    return pending("#sus-table", "Results after the user tests with 3-5 classmates.");
  }
  susChart(people);
  susTable(people);
}

init();
