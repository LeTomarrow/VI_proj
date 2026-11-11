// Map with two levels, coloured by the shared metric.
// - World: Equal Earth, one shape per continent. A switch redraws the same shapes on an
//   orthographic globe that rotates by dragging (experiment, see the decision log).
// - Continent: an equal-area projection centred on the continent, one shape per country; the
//   countries of other continents stay grey for context.
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

// Continent level: projection centre and the box (lon, lat) that must fit in the panel. A
// fixed box instead of the countries' bounds, which Russia would stretch to the Pacific.
const VIEWPORTS = {
  Europe: { centre: [15, 52], box: [[-24, 35], [42, 71]] },
  Asia: { centre: [88, 28], box: [[26, -10], [146, 54]] },
};

// Points along the edges of a lon/lat box, so that fitting them fits the curved box.
function boxPoints([[x0, y0], [x1, y1]]) {
  const xs = d3.range(x0, x1 + 1e-9, (x1 - x0) / 8);
  const ys = d3.range(y0, y1 + 1e-9, (y1 - y0) / 8);
  return {
    type: "MultiPoint",
    coordinates: [...xs.flatMap((x) => [[x, y0], [x, y1]]), ...ys.flatMap((y) => [[x0, y], [x1, y]])],
  };
}

function periodLabel({ mode, year, rangeStart }) {
  return mode === "year" ? `${year}` : `${rangeStart}–${year}`;
}

function tooltipHtml(name, stat, s) {
  const { label } = METRICS[s.metric];
  if (!stat || stat.value === null) return `<strong>${name}</strong><div>${label}: no data (${periodLabel(s)})</div>`;
  const value = formatMetric(s.metric, s.mode, stat.value);
  const detail = {
    year: `${label}: ${value} (${s.year})`,
    average: `${label}: ${value}, average ${periodLabel(s)}`,
    change: `${label}: ${value}, ${s.rangeStart} → ${s.year}`,
  }[s.mode];
  const years = s.mode === "average" && stat.yearsWithData < stat.yearsTotal
    ? `<div class="tooltip-note">Data for ${stat.yearsWithData} of ${stat.yearsTotal} years</div>`
    : "";
  return `<strong>${name}</strong><div>${detail}</div>${years}${coverageLine(stat, s.mode)}`;
}

export function createMap(selector, { atlas, mapKey, continentOf, nameOf }) {
  const projections = {
    map: d3.geoEqualEarth(),
    globe: d3.geoOrthographic().rotate(GLOBE_START),
    continent: d3.geoAzimuthalEqualArea(),
  };
  let view = "map";
  let level = "world";
  let continent = null;
  let size = null;
  let raisedFor = null;
  let path = d3.geoPath(projections.map); // of the projection drawn last

  const geometries = atlas.objects.countries.geometries;
  const continentOfShape = (g) => continentOf.get(mapKey(g)) ?? null;

  // World level. Polygons outside the six continents (Antarctica, small territories) stay neutral.
  const groups = d3.group(geometries, continentOfShape);
  const shapes = CONTINENTS.map((key) => ({ key, shape: topojson.merge(atlas, groups.get(key)) }));
  const other = topojson.merge(atlas, groups.get(null) ?? []);

  // Continent level: one feature per atlas shape (a few countries have two, e.g. N. Cyprus).
  const countryShapes = geometries
    .map((g) => ({ key: mapKey(g), continent: continentOfShape(g), shape: topojson.feature(atlas, g) }))
    .filter((d) => d.key);
  const contextOf = new Map(); // continent → merged shape of everything else, built when first shown
  const context = (key) => {
    if (!contextOf.has(key)) contextOf.set(key, topojson.merge(atlas, geometries.filter((g) => continentOfShape(g) !== key)));
    return contextOf.get(key);
  };

  const root = d3.select(selector);
  const viewSwitch = root.append("div").attr("class", "segmented map-views").attr("role", "group")
    .attr("aria-label", "Map projection");
  const viewButtons = viewSwitch.selectAll("button").data(Object.entries(VIEWS)).join("button")
    .attr("type", "button")
    .text(([, label]) => label)
    .on("click", (_, [key]) => { view = key; draw(); });

  const svg = root.append("svg").attr("role", "img");

  const defs = svg.append("defs");
  defs.append("pattern")
    .attr("id", "map-hatch").attr("patternUnits", "userSpaceOnUse")
    .attr("width", 6).attr("height", 6).attr("patternTransform", "rotate(45)")
    .append("line").attr("x1", 0).attr("x2", 0).attr("y1", 0).attr("y2", 6)
    .attr("stroke", "#0b0b0b").attr("stroke-opacity", 0.45).attr("stroke-width", 1.5);
  const gradient = defs.append("linearGradient").attr("id", "map-legend-gradient");

  const sphere = svg.append("path").datum({ type: "Sphere" }).attr("class", "map-sphere");

  const worldLayer = svg.append("g");
  const others = worldLayer.append("path").datum(other).attr("class", "map-other");
  // In their own group, so a compared continent can be raised above its neighbours (its outline
  // stays whole) without covering the labels.
  const continents = worldLayer.append("g").selectAll("g.map-continent").data(shapes, (d) => d.key).join("g")
    .attr("class", "map-continent is-clickable")
    .on("click", (event, d) => openEntityMenu(event, d.key))
    .on("mouseenter", (_, d) => setState({ hovered: d.key }))
    .on("mouseleave", () => { setState({ hovered: null }); hideTooltip(); });
  const fills = continents.append("path").attr("class", "map-fill");
  const hatches = continents.append("path").attr("class", "map-hatch").attr("fill", "url(#map-hatch)");
  const labels = worldLayer.selectAll("text.map-label").data(shapes, (d) => d.key).join("text")
    .attr("class", "map-label");
  const labelNames = labels.append("tspan").attr("class", "map-label-name").attr("x", 0);
  const labelValues = labels.append("tspan").attr("class", "map-label-value").attr("x", 0).attr("dy", "1.15em");

  // Country level. Hover and compared outlines are drawn on top as separate paths, so the
  // country under the pointer is never moved (moving it would fire its mouse events again).
  const countryLayer = svg.append("g").attr("display", "none");
  const countryContext = countryLayer.append("path").attr("class", "map-other");
  const countries = countryLayer.append("g");
  const outlines = countryLayer.append("g").attr("class", "map-outlines");
  const countryLabels = countryLayer.append("g");

  const legend = svg.append("g");
  legend.append("rect").attr("width", LEGEND_WIDTH).attr("height", 10).attr("fill", "url(#map-legend-gradient)");
  const legendAxis = legend.append("g").attr("class", "axis").attr("transform", "translate(0, 10)");
  const legendTitle = legend.append("text").attr("class", "axis-title").attr("x", LEGEND_WIDTH + 12).attr("y", 9);
  legend.append("rect").attr("x", -74).attr("width", 14).attr("height", 10).attr("fill", NO_DATA);
  legend.append("text").attr("class", "axis-title").attr("x", -56).attr("y", 9).text("no data");
  const hint = svg.append("text").attr("class", "axis-title").attr("x", 4).attr("y", 14).text("Drag to rotate");

  const atCountries = () => level === "continent" && VIEWPORTS[continent];
  const projection = () => (atCountries() ? projections.continent : projections[view]);

  function fitContinent() {
    if (!size || !atCountries()) return;
    const { centre, box } = VIEWPORTS[continent];
    const extent = [[4, 4], [size[0] - 4, size[1] - LEGEND_SPACE]];
    projections.continent.rotate([-centre[0], -centre[1]]).clipExtent(null).fitExtent(extent, boxPoints(box))
      .clipExtent(extent);
  }

  function draw() {
    const p = projection();
    path = d3.geoPath(p);
    const countryLevel = !!atCountries();

    sphere.attr("d", path);
    worldLayer.attr("display", countryLevel ? "none" : null);
    countryLayer.attr("display", countryLevel ? null : "none");
    viewSwitch.attr("hidden", countryLevel ? true : null);

    if (countryLevel) {
      countryContext.attr("d", path(context(continent)));
      countries.selectAll("path").attr("d", (d) => path(d.shape));
      outlines.selectAll("path").attr("d", (d) => path(d.shape));
      // On the visible part of the country (the path is clipped), so Russia's name stays in Europe.
      countryLabels.selectAll("text").attr("transform", (d) => `translate(${path.centroid(d.shape)})`);
    } else {
      const [lambda, phi] = p.rotate();
      others.attr("d", path);
      fills.attr("d", (d) => path(d.shape));
      hatches.attr("d", (d) => path(d.shape));
      // On the globe, a label on the far side is hidden with its continent.
      labels
        .attr("display", (d) => (view === "globe" && d3.geoDistance(LABEL_AT[d.key], [-lambda, -phi]) > Math.PI / 2 ? "none" : null))
        .attr("transform", (d) => `translate(${p(LABEL_AT[d.key])})`);
    }

    svg.classed("is-globe", !countryLevel && view === "globe");
    hint.attr("display", !countryLevel && view === "globe" ? null : "none");
    viewButtons.attr("aria-pressed", ([key]) => key === view);
  }

  function resize(width, height) {
    size = [width, height];
    const extent = [[4, 4], [width - 4, height - LEGEND_SPACE]];
    projections.map.fitExtent(extent, { type: "Sphere" });
    projections.globe.fitExtent(extent, { type: "Sphere" });
    fitContinent();
    legend.attr("transform", `translate(${(width - LEGEND_WIDTH) / 2}, ${height - 38})`);
    draw();
  }

  svg.call(d3.drag()
    .filter(() => view === "globe" && !atCountries())
    .on("drag", (event) => {
      const [lambda, phi] = projections.globe.rotate();
      projections.globe.rotate([
        lambda + event.dx * DRAG_SPEED,
        Math.max(-90, Math.min(90, phi - event.dy * DRAG_SPEED)),
      ]);
      draw();
    }));

  fitToSize(svg, resize);

  function updateWorld(stats, s, fillOf) {
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
  }

  function updateCountries(stats, s, fillOf) {
    const name = (key) => nameOf.get(key) ?? key;
    countries.selectAll("path").data(countryShapes.filter((d) => d.continent === continent), (d) => d.shape.id ?? d.key)
      .join((enter) => enter.append("path")
        .attr("class", "map-country is-clickable")
        .on("click", (event, d) => openEntityMenu(event, d.key, name(d.key)))
        .on("mouseenter", (_, d) => setState({ hovered: d.key }))
        .on("mouseleave", () => { setState({ hovered: null }); hideTooltip(); }))
      .attr("fill", fillOf)
      .on("mousemove", (event, d) => showTooltip(event, tooltipHtml(name(d.key), stats.get(d.key), s)));

    // Brushed (dashed) first, then compared, the hovered country last, so its outline is never
    // covered. The map is not faded for the brush: a lighter colour would mean a lower value.
    const order = (d) => (d.key === s.hovered ? 2 : s.compared.includes(d.key) ? 1 : 0);
    const marked = countryShapes
      .filter((d) => d.continent === continent
        && (s.compared.includes(d.key) || d.key === s.hovered || s.brushed?.has(d.key)))
      .sort((a, b) => order(a) - order(b));
    const outlineClass = (d) => (s.compared.includes(d.key) ? " is-compared"
      : d.key === s.hovered ? "" : " is-brushed");
    outlines.selectAll("path").data(marked, (d) => d.shape.id ?? d.key).join("path")
      .attr("class", (d) => `map-outline${outlineClass(d)}`)
      .attr("d", (d) => path(d.shape))
      .order();

    // Compared countries are named on the map (one label per country, on its largest shape).
    const named = d3.groups(marked.filter((d) => s.compared.includes(d.key)), (d) => d.key)
      .map(([, list]) => d3.greatest(list, (d) => d3.geoArea(d.shape)));
    countryLabels.selectAll("text").data(named, (d) => d.key).join("text")
      .attr("class", "map-label map-label-name")
      .attr("transform", (d) => `translate(${path.centroid(d.shape)})`)
      .text((d) => `✓ ${name(d.key)}`);
  }

  return {
    // stats: key → metric value of every entity shown (continents or the countries of s.continent).
    update(stats, s) {
      const moved = s.level !== level || s.continent !== continent;
      if (moved) {
        level = s.level;
        continent = s.continent;
        fitContinent();
        draw(); // before the country update, which reuses the new path for outlines and labels
      }

      const color = metricColor(s.metric, s.mode);
      const [lo, hi] = metricDomain(s.metric, s.mode);
      const fillOf = (d) => {
        const value = stats.get(d.key)?.value ?? null;
        return value === null ? NO_DATA : color(value);
      };

      if (atCountries()) updateCountries(stats, s, fillOf);
      else updateWorld(stats, s, fillOf);
      svg.attr("aria-label", atCountries()
        ? `Map of ${continent}, one colour per country`
        : "World map with one colour per continent");
      if (moved) draw(); // the countries entered above

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
