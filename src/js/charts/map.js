// Equal Earth map, one shape per continent, coloured by the shared metric. A switch redraws the
// same shapes on an orthographic globe that rotates by dragging (experiment, see the decision log).
// Base examples: d3 World choropleth (https://observablehq.com/@d3/world-choropleth).

import { CONTINENTS } from "../data/constants.js";
import { openEntityMenu } from "../entityMenu.js";
import { NO_DATA, METRICS, formatMetric, metricColor, metricDomain } from "../scales.js";
import { setState } from "../state.js";
import { coverageLine, hideTooltip, showTooltip } from "../tooltip.js";
import { fitToSize } from "./fitToSize.js";

const LEGEND_WIDTH = 220;
const LEGEND_SPACE = 44; // below the map
const VIEWS = { map: "Map", globe: "Globe" };
const GLOBE_START = [-40, -20]; // rotation that opens on Europe, Africa and western Asia
const DRAG_SPEED = 0.35; // degrees per pixel

// Where each continent's name goes (lon, lat). Centroids do not work: Russia pulls Europe's
// into Siberia.
const LABEL_AT = {
  Africa: [20, 8],
  Asia: [95, 40],
  Europe: [14, 50],
  "North America": [-103, 44],
  "South America": [-60, -14],
  Oceania: [134, -25],
};

function periodLabel({ mode, year, rangeStart }) {
  return mode === "year" ? `${year}` : `${rangeStart}–${year}`;
}

function tooltipHtml(key, stat, s) {
  const { label } = METRICS[s.metric];
  if (stat.value === null) return `<strong>${key}</strong><div>${label}: no data (${periodLabel(s)})</div>`;
  const value = formatMetric(s.metric, s.mode, stat.value);
  const detail = {
    year: `${label}: ${value} (${s.year})`,
    average: `${label}: ${value}, average ${periodLabel(s)}`,
    change: `${label}: ${value}, ${s.rangeStart} → ${s.year}`,
  }[s.mode];
  const years = s.mode === "average" && stat.yearsWithData < stat.yearsTotal
    ? `<div class="tooltip-note">Data for ${stat.yearsWithData} of ${stat.yearsTotal} years</div>`
    : "";
  return `<strong>${key}</strong><div>${detail}</div>${years}${coverageLine(stat, s.mode)}`;
}

export function createMap(selector, { atlas, mapKey, continentOf }) {
  const projections = {
    map: d3.geoEqualEarth(),
    globe: d3.geoOrthographic().rotate(GLOBE_START),
  };
  let view = "map";
  let raisedFor = null;

  // Polygons outside the six continents (Antarctica, small territories) stay neutral.
  const groups = d3.group(atlas.objects.countries.geometries, (g) => continentOf.get(mapKey(g)) ?? null);
  const shapes = CONTINENTS.map((key) => ({ key, shape: topojson.merge(atlas, groups.get(key)) }));
  const other = topojson.merge(atlas, groups.get(null) ?? []);

  const root = d3.select(selector);
  const viewButtons = root.append("div").attr("class", "segmented map-views").attr("role", "group")
    .attr("aria-label", "Map projection")
    .selectAll("button").data(Object.entries(VIEWS)).join("button")
    .attr("type", "button")
    .text(([, label]) => label)
    .on("click", (_, [key]) => { view = key; draw(); });

  const svg = root.append("svg")
    .attr("role", "img")
    .attr("aria-label", "World map with one colour per continent");

  const defs = svg.append("defs");
  defs.append("pattern")
    .attr("id", "map-hatch").attr("patternUnits", "userSpaceOnUse")
    .attr("width", 6).attr("height", 6).attr("patternTransform", "rotate(45)")
    .append("line").attr("x1", 0).attr("x2", 0).attr("y1", 0).attr("y2", 6)
    .attr("stroke", "#0b0b0b").attr("stroke-opacity", 0.45).attr("stroke-width", 1.5);
  const gradient = defs.append("linearGradient").attr("id", "map-legend-gradient");

  const sphere = svg.append("path").datum({ type: "Sphere" }).attr("class", "map-sphere");
  const others = svg.append("path").datum(other).attr("class", "map-other");

  // In their own group, so a compared continent can be raised above its neighbours (its outline
  // stays whole) without covering the labels.
  const continents = svg.append("g").selectAll("g.map-continent").data(shapes, (d) => d.key).join("g")
    .attr("class", "map-continent is-clickable")
    .on("click", (event, d) => openEntityMenu(event, d.key))
    .on("mouseenter", (_, d) => setState({ hovered: d.key }))
    .on("mouseleave", () => { setState({ hovered: null }); hideTooltip(); });
  const fills = continents.append("path").attr("class", "map-fill");
  const hatches = continents.append("path").attr("class", "map-hatch").attr("fill", "url(#map-hatch)");

  const labels = svg.selectAll("text.map-label").data(shapes, (d) => d.key).join("text")
    .attr("class", "map-label");
  const labelNames = labels.append("tspan").attr("class", "map-label-name").attr("x", 0);
  const labelValues = labels.append("tspan").attr("class", "map-label-value").attr("x", 0).attr("dy", "1.15em");

  const legend = svg.append("g");
  legend.append("rect").attr("width", LEGEND_WIDTH).attr("height", 10).attr("fill", "url(#map-legend-gradient)");
  const legendAxis = legend.append("g").attr("class", "axis").attr("transform", "translate(0, 10)");
  const legendTitle = legend.append("text").attr("class", "axis-title").attr("x", LEGEND_WIDTH + 12).attr("y", 9);
  legend.append("rect").attr("x", -74).attr("width", 14).attr("height", 10).attr("fill", NO_DATA);
  legend.append("text").attr("class", "axis-title").attr("x", -56).attr("y", 9).text("no data");
  const hint = svg.append("text").attr("class", "axis-title").attr("x", 4).attr("y", 14).text("Drag to rotate");

  function draw() {
    const projection = projections[view];
    const path = d3.geoPath(projection);
    const [lambda, phi] = projection.rotate();

    sphere.attr("d", path);
    others.attr("d", path);
    fills.attr("d", (d) => path(d.shape));
    hatches.attr("d", (d) => path(d.shape));
    // On the globe, a label on the far side is hidden with its continent.
    labels
      .attr("display", (d) => (view === "globe" && d3.geoDistance(LABEL_AT[d.key], [-lambda, -phi]) > Math.PI / 2 ? "none" : null))
      .attr("transform", (d) => `translate(${projection(LABEL_AT[d.key])})`);

    svg.classed("is-globe", view === "globe");
    hint.attr("display", view === "globe" ? null : "none");
    viewButtons.attr("aria-pressed", ([key]) => key === view);
  }

  function resize(width, height) {
    const extent = [[4, 4], [width - 4, height - LEGEND_SPACE]];
    Object.values(projections).forEach((p) => p.fitExtent(extent, { type: "Sphere" }));
    legend.attr("transform", `translate(${(width - LEGEND_WIDTH) / 2}, ${height - 38})`);
    draw();
  }

  svg.call(d3.drag()
    .filter(() => view === "globe")
    .on("drag", (event) => {
      const [lambda, phi] = projections.globe.rotate();
      projections.globe.rotate([
        lambda + event.dx * DRAG_SPEED,
        Math.max(-90, Math.min(90, phi - event.dy * DRAG_SPEED)),
      ]);
      draw();
    }));

  fitToSize(svg, resize);

  return {
    update(stats, s) {
      const color = metricColor(s.metric, s.mode);
      const [lo, hi] = metricDomain(s.metric, s.mode);
      const fillOf = (d) => {
        const { value } = stats.get(d.key);
        return value === null ? NO_DATA : color(value);
      };

      fills.attr("fill", fillOf);
      hatches.attr("display", (d) => (stats.get(d.key).partial ? null : "none"));
      const isCompared = (d) => s.compared.includes(d.key);
      labelNames.text((d) => (isCompared(d) ? `✓ ${d.key}` : d.key));
      continents
        .classed("is-compared", isCompared)
        .classed("is-hovered", (d) => d.key === s.hovered)
        .on("mousemove", (event, d) => showTooltip(event, tooltipHtml(d.key, stats.get(d.key), s)));
      // Only when the list changes: moving the node under the pointer on every hover would fire
      // its mouse events again.
      if (`${s.compared}` !== raisedFor) {
        raisedFor = `${s.compared}`;
        continents.filter(".is-compared").raise();
      }
      labelValues.text((d) => {
        const { value } = stats.get(d.key);
        return value === null ? "no data" : formatMetric(s.metric, s.mode, value);
      });

      gradient.selectAll("stop").data(d3.range(0, 1.0001, 0.1)).join("stop")
        .attr("offset", (t) => `${t * 100}%`)
        .attr("stop-color", (t) => color(lo + t * (hi - lo)));
      legendAxis.call(d3.axisBottom(d3.scaleLinear().domain([lo, hi]).range([0, LEGEND_WIDTH])).ticks(5).tickSize(4));
      legendAxis.select(".domain").remove();
      const { unit, changeUnit } = METRICS[s.metric];
      legendTitle.text(s.mode === "change"
        ? `${changeUnit.trim()}, blue = cleaner`
        : unit.trim());
    },
  };
}
