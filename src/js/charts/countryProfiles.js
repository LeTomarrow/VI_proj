// Country profiles (View C): share of each source in the compared countries and the World.

import { SOURCE_GROUPS, COUNTRY_COMPARE_COLORS } from "../scales.js";
import { comparedSlot, comparisonType, setState } from "../state.js";
import { hideTooltip, showTooltip } from "../tooltip.js";
import { fitToSize } from "./fitToSize.js";

const LABEL_ROOM_X = 120; // beside the radar, for the axis names
const LABEL_ROOM_Y = 24;
const MIN_RADIUS = 40;
const AXIS_LABEL_OFFSET = 16;
const RING_STEP = 20; // % between rings
const MIN_MAX_SHARE = 40;
const WORLD_COLOR = "#6f6d68";
const POINT_R = 4;  // 8 px markers
const HIT_R = 10;   // hover zone around each marker

// Source shares use a fixed scale across countries and years; polygon area is not a total.
export function sourceProfile(record) {
  if (!record || !(record.generation > 0)) return null;
  return SOURCE_GROUPS.map((group) => {
    const generation = d3.sum(group.parts, (key) => record.sources[key]);
    return {
      ...group,
      generation,
      share: 100 * generation / record.generation,
    };
  });
}

// Axes run clockwise, starting at the top of the radar.
function axisPoint(index, distance) {
  const angle = index * 2 * Math.PI / SOURCE_GROUPS.length - Math.PI / 2;
  return [Math.cos(angle) * distance, Math.sin(angle) * distance];
}

function labelAnchor(x) {
  if (Math.abs(x) < 1) return "middle";
  return x > 0 ? "start" : "end";
}

function drawAxes(plot, radial, line) {
  plot.selectAll("*").remove();
  const radius = radial.range()[1];
  for (const value of d3.range(RING_STEP, radial.domain()[1] + 1, RING_STEP)) {
    const ring = SOURCE_GROUPS.map((_, index) => axisPoint(index, radial(value)));
    plot.append("path")
      .attr("class", "profile-grid")
      .attr("d", line(ring));
    plot.append("text")
      .attr("class", "profile-tick")
      .attr("x", 5)
      .attr("y", -radial(value) + 12)
      .text(`${value}%`);
  }

  SOURCE_GROUPS.forEach((source, index) => {
    const [x, y] = axisPoint(index, radius);
    const [labelX, labelY] = axisPoint(index, radius + AXIS_LABEL_OFFSET);
    plot.append("line")
      .attr("class", "profile-grid")
      .attr("x2", x)
      .attr("y2", y);
    plot.append("text")
      .attr("class", "profile-axis-label")
      .attr("x", labelX)
      .attr("y", labelY)
      .attr("dy", "0.35em")
      .attr("text-anchor", labelAnchor(labelX))
      .text(`${source.label} (%)`);
  });
}

function updateLegend(legend, series) {
  legend.selectAll("li").data(series, (profile) => profile.key).join("li")
    .each(function (profile) {
      const item = d3.select(this);
      item.selectAll("*").remove();
      item.append("span").attr("class", "swatch").style("background", profile.color);
      item.append("span").text(profile.key === "World" ? "World (dashed)" : profile.name);
    });
}

export function createCountryProfiles(selector, { countries, world }) {
  const root = d3.select(selector);
  const byCountry = d3.index(countries, (r) => r.key, (r) => r.year);
  const byWorld = d3.index(world, (r) => r.year);
  const names = new Map(countries.map((r) => [r.key, r.name]));
  const note = root.append("p").attr("class", "how-to-read").attr("role", "status");
  // Legend beside the radar, so the radar gets the panel's full height.
  const body = root.append("div").attr("class", "profile-body");
  const legend = body.append("ul").attr("class", "legend profile-legend").attr("aria-label", "Country colours");
  // Sized to the panel (fitToSize), so opening the tab never makes the page rows grow.
  const svg = body.append("svg").attr("class", "profile-radar").attr("role", "img");
  const plot = svg.append("g");
  const axes = plot.append("g");
  const shapes = plot.append("g");
  const radial = d3.scaleLinear().domain([0, 100]);
  const line = d3.line().curve(d3.curveLinearClosed);
  let current = null;
  let sized = false;

  function comparisonData(state) {
    const selected = state.compared.filter((key) => comparisonType(key) === "countries");
    const missing = [];
    const series = selected.flatMap((key) => {
      const record = byCountry.get(key)?.get(state.year);
      const values = sourceProfile(record);
      if (!values) {
        missing.push(names.get(key) ?? key);
        return [];
      }
      return [{ key, name: record.name, color: COUNTRY_COMPARE_COLORS[comparedSlot(key)], values }];
    });
    const reference = sourceProfile(byWorld.get(state.year));
    if (reference && selected.length) {
      series.unshift({ key: "World", name: "World", color: WORLD_COLOR, values: reference });
    }
    return { selected, missing, series, reference };
  }

  function updateDescription(state, { selected, missing, series, reference }) {
    d3.select("#profiles-title").text(`Electricity mix of the compared countries, ${state.year}`);
    d3.select("#profiles-description").text(`Each axis is a source's share of generation (0–${radial.domain()[1]}%, the largest share shown). Grey dashed = World.`);
    const messages = [];
    if (!selected.length) messages.push("Add countries with + Compare to see their energy profiles.");
    else {
      if (missing.length) messages.push(`No generation data for ${missing.join(", ")} in ${state.year}.`);
      if (!reference) messages.push(`World reference unavailable for ${state.year}.`);
    }
    note.text(messages.join(" "));
    svg.attr("hidden", selected.length ? null : true)
      .attr("aria-label", `Electricity source shares in ${state.year}: ${series.map((d) => d.name).join(", ")}. All axes range from 0 to 100 percent.`);
  }

  function pointTooltip(profile, v, year) {
    return `<strong>${profile.name}, ${year}</strong>`
      + `<div class="tooltip-row"><span>${v.label}</span><span>${v.share.toFixed(1)}%</span></div>`
      + `<div class="tooltip-row"><span>Generation</span><span>${d3.format(",.1f")(v.generation)} TWh</span></div>`;
  }

  function updateShapes(series, s) {
    const year = s.year;
    const point = (v, i) => axisPoint(i, radial(v.share));
    const groups = shapes.selectAll("g.profile-shape").data(series, (d) => d.key).join("g")
      .attr("class", "profile-shape")
      // The hovered country is drawn on top and the others fade.
      .classed("is-dimmed", (d) => s.hovered !== null && d.key !== "World" && series.some((p) => p.key === s.hovered) && d.key !== s.hovered)
      .order();
    groups.filter((d) => d.key === s.hovered).raise();
    groups.each(function (profile) {
      const group = d3.select(this);
      const hovered = profile.key === s.hovered;
      group.selectAll("path").data([profile]).join("path")
        .attr("d", line(profile.values.map(point)))
        .attr("fill", profile.color).attr("fill-opacity", profile.key === "World" ? 0 : 0.1)
        .attr("stroke", profile.color).attr("stroke-width", hovered ? 3 : 2)
        .attr("stroke-dasharray", profile.key === "World" ? "5 4" : null)
        .attr("pointer-events", "none");
      group.selectAll("circle.profile-point").data(profile.values).join("circle")
        .attr("class", "profile-point")
        .attr("cx", (v, i) => point(v, i)[0]).attr("cy", (v, i) => point(v, i)[1])
        .attr("r", POINT_R).attr("fill", profile.color).attr("tabindex", 0)
        .attr("aria-label", (v) => `${profile.name}, ${year}, ${v.label}: ${v.share.toFixed(1)}%, ${v.generation.toFixed(1)} TWh`);
      group.selectAll("circle.hit-area").data(profile.values).join("circle")
        .attr("class", "hit-area")
        .attr("cx", (v, i) => point(v, i)[0]).attr("cy", (v, i) => point(v, i)[1])
        .attr("r", HIT_R)
        .on("mouseenter", () => { if (profile.key !== "World") setState({ hovered: profile.key }); })
        .on("mousemove", (event, v) => showTooltip(event, pointTooltip(profile, v, year)))
        .on("mouseleave", () => { hideTooltip(); if (profile.key !== "World") setState({ hovered: null }); });
    });
  }

  fitToSize(svg, (width, height) => {
    const radius = Math.max(MIN_RADIUS, Math.min(width / 2 - LABEL_ROOM_X, height / 2 - LABEL_ROOM_Y));
    radial.range([0, radius]);
    sized = true;
    plot.attr("transform", `translate(${width / 2},${height / 2})`);
    drawAxes(axes, radial, line);
    if (current) updateShapes(comparisonData(current).series, current);
  });

  return {
    update(state) {
      current = state;
      const data = comparisonData(state);
      // The outer ring is the largest share shown, rounded up, so small shares are not squeezed
      // into the centre. Every axis keeps the same scale, so shapes stay comparable.
      const top = d3.max(data.series, (p) => d3.max(p.values, (v) => v.share)) ?? 0;
      const maxShare = Math.min(100, Math.max(MIN_MAX_SHARE, Math.ceil(top / RING_STEP) * RING_STEP));
      if (maxShare !== radial.domain()[1]) {
        radial.domain([0, maxShare]);
        if (sized) drawAxes(axes, radial, line);
      }
      updateDescription(state, data);
      updateLegend(legend, data.series);
      if (sized) updateShapes(data.series, state);
    },
  };
}
