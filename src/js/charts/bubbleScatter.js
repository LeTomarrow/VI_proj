// View B: one bubble per country of the continent in the selected year. x = emissions per
// person (log), y = carbon intensity, area = total emissions, colour = renewable share.
// Base examples: The Wealth & Health of Nations (https://observablehq.com/@mbostock/the-wealth-health-of-nations)
// and Brushable scatterplot (https://observablehq.com/@d3/brushable-scatterplot).

import { COMPLETE_YEARS } from "../data/constants.js";
import { openEntityMenu } from "../entityMenu.js";
import { NO_DATA, svgUnitText } from "../scales.js";
import { inRegion, MIN_EMISSIONS, scatterComparedCountries, scatterTrailKeys, shownAt, validBubble } from "../data/scatter.js";
import { addCompared, MAX_COMPARED, setState } from "../state.js";
import { tween } from "../motion.js";
import { hideTooltip, showTooltipOutsidePlot } from "../tooltip.js";
import { fitToSize } from "./fitToSize.js";

const MARGIN = { top: 14, right: 28, bottom: 40, left: 58 };
const TOP_LABELS = 5;   // largest emitters named even over a neighbouring bubble (never over a name)
const HOVER_PAD = 10;   // hover zone beyond a bubble's edge
const MIN_R = 4;        // smallest bubble (8 px), so small emitters stay visible
const LABEL_H = 12;
const CHAR_W = 6.2;     // estimated label width per character, to skip overlapping names

// Starts further up the ramp than the map, so a low share is still a visible green on white.
const colorOf = (share) => d3.interpolateGreens(0.3 + 0.7 * Math.max(0, Math.min(100, share)) / 100);
const fillOf = (r) => (r.renewableShare === null ? NO_DATA : colorOf(r.renewableShare));
const fmt = (digits) => d3.format(`,.${digits}f`);

// The World's lines split the plot in four. Emissions per person = carbon intensity × electricity
// per person, so right of the World line with a clean grid means a high use of clean electricity.
const QUADRANTS = [
  { left: true, top: false, text: "Cleaner than the World", cls: "is-cleaner" },
  { left: false, top: true, text: "Dirty grid, high CO₂e per person", cls: "is-dirtier" },
  { left: true, top: true, text: "Dirty grid, low use per person", cls: "" },
  { left: false, top: false, text: "Clean grid, high use per person", cls: "" },
];

function tooltipHtml(r) {
  const row = (label, value) => `<div class="tooltip-row"><span>${label}</span><span>${value}</span></div>`;
  return `<strong>${r.name}, ${r.year}</strong>`
    + row("CO₂e/person", `${fmt(2)(r.emissionsPerCapita)} t`)
    + row("CO₂e/kWh", `${fmt(0)(r.carbonIntensity)} g`)
    + row("Electricity/person", r.generationPerCapita === null ? "no data" : `${fmt(0)(r.generationPerCapita)} kWh`)
    + row("Total CO₂e", `${fmt(1)(r.emissions)} Mt`)
    + row("Renewable share", r.renewableShare === null ? "no data" : `${fmt(1)(r.renewableShare)}%`);
}

export function createBubbleScatter(selector, { countries, world, countriesOf }) {
  const byCountry = d3.index(countries, (r) => r.key, (r) => r.year);
  const byWorld = d3.index(world, (r) => r.year);
  const x = d3.scaleLog();
  const y = d3.scaleLinear();
  const radius = d3.scaleSqrt();
  const domains = new Map(); // continent → fixed domains over 2000-2024, so movement means change

  const root = d3.select(selector);
  const tools = root.append("div").attr("class", "mekko-tools");
  const filter = tools.append("label");
  filter.append("span").text("Show");
  const filterButtons = tools.append("div").attr("class", "segmented").attr("role", "group")
    .attr("aria-label", "Countries shown, by total emissions")
    .selectAll("button").data(MIN_EMISSIONS).join("button")
    .attr("type", "button")
    .text(([, label]) => label)
    .attr("title", ([n]) => (n ? `Only countries emitting at least ${n} Mt CO₂e from electricity` : "Every country with data"))
    .on("click", (_, [n]) => setState({ scatterMin: n }));
  // Adds the brushed group to the comparison list, largest emitters first, up to the limit.
  let toCompare = [];
  const compareButton = tools.append("button").attr("type", "button").attr("class", "sort-toggle compare-brushed")
    .attr("hidden", true)
    .on("click", () => addCompared(toCompare));
  // Beside the Show buttons, which it refers to.
  const note = tools.append("p").attr("class", "how-to-read scatter-note").attr("role", "status");
  // Below the plot (appended after the svg), so the plot sits right under its controls.
  const legend = d3.create("ul").attr("class", "legend scatter-legend");
  const ramp = legend.append("li");
  ramp.append("span").text("Renewable share 0%");
  ramp.append("span").attr("class", "ramp")
    .style("background", `linear-gradient(to right, ${d3.range(0, 1.01, 0.1).map((t) => colorOf(100 * t)).join(", ")})`);
  ramp.append("span").text("100%");
  legend.append("li").html(`<span class="swatch" style="background:${NO_DATA}"></span>No data`);
  legend.append("li").html(`<span class="swatch swatch-ring"></span>Area = total emissions`);
  legend.append("li").html(`<span class="swatch swatch-dash"></span>World`);

  const svg = root.append("svg").attr("role", "img");
  root.append(() => legend.node());
  const plot = svg.append("g").attr("transform", `translate(${MARGIN.left}, ${MARGIN.top})`);
  const xAxis = plot.append("g").attr("class", "axis");
  const yAxis = plot.append("g").attr("class", "axis");
  const xTitle = svgUnitText(plot.append("text").attr("class", "axis-title").attr("text-anchor", "middle"),
    [["CO₂e", "CO₂e"], " per person (", ["t", "t"], ", ", ["log scale", "log"], ") →"]);
  const yTitle = svgUnitText(plot.append("text").attr("class", "axis-title").attr("text-anchor", "middle"),
    ["Dirtier electricity (", ["gCO₂e/kWh", "gCO₂e/kWh"], ") →"]);
  const worldX = plot.append("line").attr("class", "reference-line");
  const worldY = plot.append("line").attr("class", "reference-line");
  const worldLabel = plot.append("text").attr("class", "axis-title").attr("text-anchor", "end").text("World");
  const quadrants = plot.append("g").selectAll("text").data(QUADRANTS).join("text")
    .attr("class", (q) => `quadrant-label ${q.cls}`)
    .attr("text-anchor", (q) => (q.left ? "start" : "end"))
    .text((q) => q.text);
  const trails = plot.append("g");
  const bubbles = plot.append("g");
  const labels = plot.append("g");
  // The brush's overlay is also the hover and click layer (nearest bubble).
  const brushLayer = plot.append("g").attr("class", "brush");

  let innerW = 0;
  let innerH = 0;
  let current = null;
  let hoveredKey = null;
  let points = [];
  let brushing = false;
  let brushSignature = null;

  // The region in data units of a pixel selection.
  const regionOf = ([[px0, py0], [px1, py1]]) => ({
    continent: current.continent,
    x: [x.invert(px0), x.invert(px1)],
    y: [y.invert(py1), y.invert(py0)],
  });
  // While dragging, the other charts are told only when the group changes.
  const brush = d3.brush()
    .on("start", (event) => { if (event.sourceEvent) { brushing = true; hideTooltip(); } })
    .on("brush", (event) => {
      if (!event.sourceEvent || !event.selection) return;
      const region = regionOf(event.selection);
      const signature = points.filter((p) => inRegion(p.r, region)).map((p) => p.r.key).join();
      if (signature !== brushSignature) { brushSignature = signature; setState({ brush: region }); }
    })
    .on("end", (event) => {
      if (!event.sourceEvent) return;
      brushing = false;
      brushSignature = null;
      setState({ brush: event.selection ? regionOf(event.selection) : null });
    });

  function domainsOf(continent) {
    if (!domains.has(continent)) {
      const records = (countriesOf.get(continent) ?? []).flatMap((k) => [...(byCountry.get(k)?.values() ?? [])])
        .filter((r) => validBubble(r) && r.year >= COMPLETE_YEARS[0] && r.year <= COMPLETE_YEARS[1]);
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
    // Kept small so neighbours overlap less; the area still ranks the emitters.
    radius.range([0, Math.max(10, Math.min(26, Math.min(innerW, innerH) / 12))]);
    brush.extent([[0, 0], [Math.max(1, innerW), Math.max(1, innerH)]]);
    brushLayer.call(brush);
    xTitle.attr("x", innerW / 2).attr("y", innerH + 34);
    yTitle.attr("transform", `translate(-44, ${innerH / 2}) rotate(-90)`);
    if (current) render(current);
  }

  function render(s) {
    const d = domainsOf(s.continent);
    x.domain(d.x).nice();
    y.domain(d.y).nice();
    radius.domain(d.r);
    const comparedCountries = scatterComparedCountries(s);
    const comparing = comparedCountries.length > 0;
    // Comparing: only the compared countries, plus the brushed group while there is a brush.
    const keys = (countriesOf.get(s.continent) ?? [])
      .filter((key) => !comparing || comparedCountries.includes(key) || !!s.brushed?.has(key));
    const filterOff = comparing && !s.brushed;
    filterButtons.attr("aria-pressed", ([n]) => String(n === (filterOff ? 0 : (s.scatterMin ?? 0))))
      .property("disabled", filterOff)
      .attr("title", ([n]) => filterOff ? "All compared countries with data are shown. Clear the comparison to filter all countries."
        : n ? `Only countries emitting at least ${n} Mt CO₂e from electricity` : "Every country with data");
    const ofYear = keys.map((k) => byCountry.get(k)?.get(s.year)).filter(validBubble);
    const shown = ofYear.filter((r) => shownAt(r, s));
    const hidden = ofYear.length - shown.length;
    points = shown
      .sort((a, b) => b.emissions - a.emissions)
      .map((r) => ({ r, cx: x(r.emissionsPerCapita), cy: y(r.carbonIntensity), rr: Math.max(MIN_R, radius(r.emissions)) }));
    const withGeneration = keys.filter((k) => byCountry.get(k)?.get(s.year)?.generation > 0).length;

    note.text(s.year < COMPLETE_YEARS[0]
      ? `No emissions data before ${COMPLETE_YEARS[0]}. Move the year slider to ${COMPLETE_YEARS[0]} or later.`
      : [s.brushed ? `${s.brushed.size} selected (dashed on the map). Click outside the box to clear.`
        : comparing ? "Compared countries only. Clear the comparison to see all." : "",
        withGeneration > ofYear.length ? `${withGeneration - ofYear.length} of ${withGeneration} countries have no emissions data in ${s.year}.` : "",
        hidden ? `${hidden} smaller emitters hidden (Show).` : ""].filter(Boolean).join(" "));
    svg.attr("aria-label", `Bubble scatter of ${points.length} countries of ${s.continent} in ${s.year}: emissions per person, carbon intensity and total emissions.`);

    xAxis.attr("transform", `translate(0, ${innerH})`)
      .call(d3.axisBottom(x).ticks(Math.max(3, innerW / 90), "~g").tickSize(4));
    yAxis.call(d3.axisLeft(y).ticks(Math.max(3, innerH / 50)).tickSize(4))
      .call((g) => g.select(".domain").remove());

    const w = byWorld.get(s.year);
    const showWorld = validBubble(w);
    worldX.attr("display", showWorld ? null : "none");
    worldY.attr("display", showWorld ? null : "none");
    worldLabel.attr("display", showWorld ? null : "none");
    quadrants.attr("display", showWorld ? null : "none");
    if (showWorld) {
      const wx = x(w.emissionsPerCapita);
      const wy = y(w.carbonIntensity);
      worldX.attr("x1", wx).attr("x2", wx).attr("y1", 0).attr("y2", innerH);
      worldY.attr("x1", 0).attr("x2", innerW).attr("y1", wy).attr("y2", wy);
      worldLabel.attr("x", innerW).attr("y", wy - 4);
      // Each label in the outer corner of its quadrant. On a narrow plot, a row whose two labels
      // would overlap keeps only the bold one (cleaner / more polluting than the World).
      quadrants
        .attr("x", (q) => (q.left ? 6 : innerW - 4))
        .attr("y", (q) => (q.top ? 10 : innerH - 6));
      const widthOf = new Map(quadrants.nodes().map((n, i) => [QUADRANTS[i], n.getComputedTextLength()]));
      const rowFits = (top) => d3.sum(QUADRANTS.filter((q) => q.top === top), (q) => widthOf.get(q)) + 24 <= innerW;
      quadrants.attr("display", (q) => (q.cls || rowFits(q.top) ? null : "none"));
    }

    // Hover reveals a single history, avoiding overlapping trails for the whole comparison.
    const comparedHere = scatterTrailKeys(shown.map((r) => r.key), s);
    const trailData = comparedHere.map((key) => ({
      key,
      path: d3.range(s.rangeStart, s.year + 1).map((yr) => byCountry.get(key)?.get(yr)).filter(validBubble),
    })).filter((t) => t.path.length > 1);
    const trail = trails.selectAll("g.trail").data(trailData, (t) => t.key).join((enter) => {
      const g = enter.append("g").attr("class", "trail");
      g.append("path");
      g.append("circle").attr("r", 3);
      return g;
    });
    trail.select("path").attr("d", (t) => d3.line((r) => x(r.emissionsPerCapita), (r) => y(r.carbonIntensity))(t.path));
    trail.select("circle").attr("cx", (t) => x(t.path[0].emissionsPerCapita)).attr("cy", (t) => y(t.path[0].carbonIntensity));

    bubbles.selectAll("circle").data(points, (p) => p.r.key).join(
      (enter) => enter.append("circle").attr("cx", (p) => p.cx).attr("cy", (p) => p.cy).attr("r", 0),
    )
      .call((sel) => tween(sel, s)
        .attr("cx", (p) => p.cx).attr("cy", (p) => p.cy).attr("r", (p) => p.rr)
        .attr("fill", (p) => fillOf(p.r)))
      .style("--ring", (p) => d3.color(fillOf(p.r)).darker(1).formatHex())
      .attr("class", "bubble")
      .classed("is-compared", (p) => s.compared.includes(p.r.key))
      .classed("is-hovered", (p) => p.r.key === s.hovered)
      .classed("is-outside", (p) => !!s.brushed && !s.brushed.has(p.r.key) && p.r.key !== s.hovered
        && !s.compared.includes(p.r.key));
    // Marked bubbles on top, so their outline is never covered.
    bubbles.selectAll("circle.is-compared, circle.is-hovered").raise();

    // The brushed countries not yet compared, largest emitters first (points are sorted).
    const compared = s.compared.filter((k) => keys.includes(k));
    const free = MAX_COMPARED - compared.length;
    const brushedNew = s.brushed ? points.filter((p) => s.brushed.has(p.r.key) && !s.compared.includes(p.r.key)) : [];
    toCompare = brushedNew.map((p) => p.r.key);
    compareButton.attr("hidden", s.brushed ? null : true)
      .property("disabled", !brushedNew.length || free <= 0)
      .text(!brushedNew.length ? "+ Compare: all selected are compared"
        : free <= 0 ? `+ Compare: list full (${compared.length})`
        : brushedNew.length <= free ? `+ Compare these ${brushedNew.length}`
        : `+ Compare the ${free} largest of ${brushedNew.length}`)
      .attr("title", `Add the selected countries to the comparison, largest emitters first (up to ${MAX_COMPARED})`);

    // Names: hovered, compared, then every other bubble from the largest emitter down (only the
    // brushed group, if any), each placed right, left, above or below its bubble where it covers
    // no other name or bubble. Hovered and compared names are always shown; the TOP_LABELS
    // largest may cover a neighbouring bubble, but not another name.
    const marked = (p) => s.compared.includes(p.r.key) || p.r.key === s.hovered;
    const others = s.brushed ? points.filter((p) => s.brushed.has(p.r.key)) : points;
    const ranked = [
      ...points.filter((p) => p.r.key === s.hovered),
      ...points.filter((p) => s.compared.includes(p.r.key) && p.r.key !== s.hovered),
      ...others.filter((p) => !marked(p)),
    ];
    // The quadrant names count as placed labels, so country names keep clear of them.
    const boxes = [];
    quadrants.each(function () {
      if (this.getAttribute("display") === "none") return;
      const b = this.getBBox();
      boxes.push({ x0: b.x, x1: b.x + b.width, y0: b.y, y1: b.y + b.height });
    });
    const hitsLabel = (box) => boxes.some((b) => b.x0 < box.x1 && box.x0 < b.x1 && b.y0 < box.y1 && box.y0 < b.y1);
    const hitsBubble = (box, self) => points.some((q) => q !== self
      && Math.hypot(q.cx - Math.max(box.x0, Math.min(q.cx, box.x1)), q.cy - Math.max(box.y0, Math.min(q.cy, box.y1))) < q.rr);
    const inside = (box) => box.x0 >= 0 && box.x1 <= innerW && box.y0 >= 0 && box.y1 <= innerH;
    const candidates = (p, text) => {
      const w = text.length * CHAR_W * (s.compared.includes(p.r.key) ? 1.15 : 1); // compared names are bold
      const h = LABEL_H / 2;
      return [
        { x0: p.cx + p.rr + 3, x1: p.cx + p.rr + 3 + w, y0: p.cy - h, y1: p.cy + h, ty: p.cy, anchor: "start" },
        { x0: p.cx - p.rr - 3 - w, x1: p.cx - p.rr - 3, y0: p.cy - h, y1: p.cy + h, ty: p.cy, anchor: "end" },
        { x0: p.cx - w / 2, x1: p.cx + w / 2, y0: p.cy - p.rr - 2 - 2 * h, y1: p.cy - p.rr - 2, ty: p.cy - p.rr - 2 - h, anchor: "middle" },
        { x0: p.cx - w / 2, x1: p.cx + w / 2, y0: p.cy + p.rr + 2, y1: p.cy + p.rr + 2 + 2 * h, ty: p.cy + p.rr + 2 + h, anchor: "middle" },
      ].map((b) => ({ ...b, text }));
    };
    const top = new Set(others.slice(0, TOP_LABELS));
    const named = ranked.filter((p) => {
      const text = s.compared.includes(p.r.key) ? `✓ ${p.r.name}` : p.r.name;
      const options = candidates(p, text).filter(inside);
      const forced = p.r.key === s.hovered || s.compared.includes(p.r.key);
      const box = options.find((b) => !hitsLabel(b) && !hitsBubble(b, p))
        ?? (forced || top.has(p) ? options.find((b) => !hitsLabel(b)) : null)
        ?? (forced ? options[0] ?? candidates(p, text)[0] : null);
      if (!box) return false;
      boxes.push(box);
      p.box = box;
      return true;
    });
    labels.selectAll("text").data(named, (p) => p.r.key).join("text")
      .attr("class", (p) => `bubble-label${s.compared.includes(p.r.key) ? " is-compared" : ""}`)
      .call((sel) => tween(sel, s)
        .attr("x", (p) => (p.box.anchor === "start" ? p.box.x0 : p.box.anchor === "end" ? p.box.x1 : (p.box.x0 + p.box.x1) / 2))
        .attr("y", (p) => p.box.ty))
      .attr("dy", "0.32em")
      .attr("text-anchor", (p) => p.box.anchor)
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
    brushLayer
      .on("mousemove.hover", (event) => {
        if (brushing) return;
        const p = nearest(event);
        const key = p?.r.key ?? null;
        if (key !== hoveredKey) { hoveredKey = key; setState({ hovered: key }); }
        if (p) {
          const box = svg.node().getBoundingClientRect();
          showTooltipOutsidePlot({ left: box.left + MARGIN.left, right: box.right - MARGIN.right,
            top: box.top + MARGIN.top, bottom: box.bottom - MARGIN.bottom }, tooltipHtml(p.r));
        }
        else hideTooltip();
        brushLayer.select(".overlay").style("cursor", p ? "pointer" : null);
      })
      .on("mouseleave.hover", () => { hoveredKey = null; setState({ hovered: null }); hideTooltip(); })
      .on("click.menu", (event) => {
        const p = nearest(event);
        if (p) openEntityMenu(event, p.r.key, p.r.name);
      });

    // Redraw the stored region (resize, year change); clear it on another continent.
    if (!brushing) {
      const b = s.brush?.continent === s.continent ? s.brush : null;
      brushLayer.call(brush.move, b ? [[x(b.x[0]), y(b.y[1])], [x(b.x[1]), y(b.y[0])]] : null);
    }
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
