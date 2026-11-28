// Profiles (View C, top): one radar per compared country or continent, with shared source-share
// scales, and an optional reference polygon (World, or the countries' continent) on every radar.
// Base examples: d3-star-plot (https://github.com/kevinschaul/d3-star-plot) and Radar chart
// (https://observablehq.com/@palewire/radar-chart).

import { SOURCE_GROUPS, COUNTRY_COMPARE_COLORS, CONTINENT_COLORS } from "../scales.js";
import { comparedSlot, comparisonType, setState } from "../state.js";
import { referenceFor, sourceProfile } from "../data/compare.js";
import { hideTooltip, showTooltip } from "../tooltip.js";
import { titleWith } from "../titles.js";

const LABEL_ROOM_X = 66; // beside the radar, for the axis names
const LABEL_ROOM_Y = 24;
const MIN_RADIUS = 40;
const AXIS_LABEL_OFFSET = 16;
const RING_STEP = 20; // % between rings
const MIN_MAX_SHARE = 40;
const POINT_R = 4;  // 8 px markers
const HIT_R = 10;   // hover zone around each marker
const FOSSIL_GROUPS = ["coal", "oil", "gas"];

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
    const label = plot.append("text")
      .attr("class", "profile-axis-label")
      .attr("x", labelX)
      .attr("y", labelY)
      .attr("text-anchor", labelAnchor(labelX));
    // The rings carry the % unit, so the names stay short and fit narrow cards.
    const lines = source.key === "bioOther" ? ["Bioenergy", "& other"] : [source.label];
    label.selectAll("tspan").data(lines).join("tspan")
      .attr("x", labelX)
      .attr("dy", (_, i) => i === 0 ? (lines.length > 1 ? "-0.25em" : "0.35em") : "1.15em")
      .text((text) => text);
  });
}

export function createCountryProfiles(selector, { countries, continents, world }) {
  const root = d3.select(selector);
  const byCountry = d3.index(countries, (r) => r.key, (r) => r.year);
  const byContinent = d3.index(continents, (r) => r.key, (r) => r.year);
  const byWorld = d3.index(world, (r) => r.year);
  const names = new Map(countries.map((r) => [r.key, r.name]));
  const continentOf = new Map(countries.map((r) => [r.key, r.continent]));
  const tools = root.append("div").attr("class", "mekko-tools");
  tools.append("label").append("span").text("Reference");
  const refGroup = tools.append("div").attr("class", "segmented").attr("role", "group").attr("aria-label", "Reference shape");
  const note = root.append("p").attr("class", "how-to-read").attr("role", "status");
  const body = root.append("div").attr("class", "profile-body");
  const cards = new Map();
  const radial = d3.scaleLinear().domain([0, 100]);
  const line = d3.line().curve(d3.curveLinearClosed);
  let current = null;
  let currentReference = null;

  function comparisonData(state) {
    const missing = [];
    const series = state.compared.flatMap((key) => {
      const continent = comparisonType(key) === "continents";
      const record = (continent ? byContinent : byCountry).get(key)?.get(state.year);
      const values = sourceProfile(record);
      if (!values) {
        missing.push(names.get(key) ?? key);
        return [];
      }
      const color = continent ? CONTINENT_COLORS[key] : COUNTRY_COMPARE_COLORS[comparedSlot(key)];
      return [{ key, name: record.name ?? key, color, values }];
    });
    return { missing, series };
  }

  // The reference: the World, or the continent of the compared countries (they share one).
  function referenceOf(state) {
    const { options, pick, continent } = referenceFor(state.compared, state.profileRef, (k) => continentOf.get(k));
    const record = pick === "world" ? byWorld.get(state.year)
      : pick === "continent" ? byContinent.get(continent)?.get(state.year) : null;
    const values = sourceProfile(record);
    return { options, pick, profile: values ? { name: pick === "world" ? "World" : continent, values } : null };
  }

  function updateDescription(state, { missing }, reference) {
    titleWith("#profiles-title", "Share of each source", state.year);
    d3.select("#profiles-description").html(`<b>Each axis</b> = share of one source, same 0-${radial.domain()[1]}% scale on every radar.`
      + (reference.profile ? ` <b>Dashed grey</b> = ${reference.profile.name}.` : ""));
    note.text(missing.length ? `No generation data for ${missing.join(", ")} in ${state.year}.` : "");
  }

  function pointTooltip(profile, v, year) {
    const ref = currentReference?.values.find((r) => r.key === v.key);
    return `<strong>${profile.name}, ${year}</strong>`
      + `<div class="tooltip-row"><span>${v.label}</span><span>${v.share.toFixed(1)}%</span></div>`
      + (ref ? `<div class="tooltip-row"><span>${currentReference.name}</span><span>${ref.share.toFixed(1)}%</span></div>` : "")
      + `<div class="tooltip-row"><span>Generation</span><span>${d3.format(",.1f")(v.generation)} TWh</span></div>`;
  }

  // Low-carbon share as one number per card, so close shapes can still be told apart (user test, T5).
  const lowCarbonOf = (values) => d3.sum(values.filter((v) => !FOSSIL_GROUPS.includes(v.key)), (v) => v.share);
  function summaryText(profile) {
    const own = lowCarbonOf(profile.values);
    if (!currentReference) return `Low-carbon ${own.toFixed(0)}%`;
    const ref = lowCarbonOf(currentReference.values);
    const diff = own - ref;
    const verdict = Math.abs(diff) < 0.5 ? "same as" : diff > 0 ? "cleaner than" : "dirtier than";
    return `Low-carbon ${own.toFixed(0)}% | ${verdict} ${currentReference.name} (${ref.toFixed(0)}%)`;
  }

  function updateShapes(shapes, series, s, scale, reference) {
    const year = s.year;
    const point = (v, i) => axisPoint(i, scale(v.share));
    shapes.selectAll("path.profile-reference").data(reference ? [reference] : []).join("path")
      .attr("class", "profile-reference")
      .attr("d", (ref) => line(ref.values.map(point)))
      .lower();
    const groups = shapes.selectAll("g.profile-shape").data(series, (d) => d.key).join("g")
      .attr("class", "profile-shape")
      .order();
    groups.each(function (profile) {
      const group = d3.select(this);
      const hovered = profile.key === s.hovered;
      group.selectAll("path").data([profile]).join("path")
        .attr("d", line(profile.values.map(point)))
        .attr("fill", profile.color).attr("fill-opacity", 0.15)
        .attr("stroke", profile.color).attr("stroke-width", hovered ? 3 : 2)
        .attr("pointer-events", "none");
      group.selectAll("circle.profile-point").data(profile.values).join("circle")
        .attr("class", "profile-point")
        .attr("cx", (v, i) => point(v, i)[0]).attr("cy", (v, i) => point(v, i)[1])
        .attr("r", POINT_R).attr("fill", profile.color).attr("tabindex", 0)
        .attr("aria-label", (v) => `${profile.name}, ${year}, ${v.label}: ${v.share.toFixed(1)}%, ${v.generation.toFixed(1)} TWh`)
        // Keyboard focus shows the same values as hover, next to the point.
        .on("focus", function (event, v) {
          const box = this.getBoundingClientRect();
          showTooltip({ clientX: box.right, clientY: box.top }, pointTooltip(profile, v, year));
        })
        .on("blur", hideTooltip);
      group.selectAll("circle.hit-area").data(profile.values).join("circle")
        .attr("class", "hit-area")
        .attr("cx", (v, i) => point(v, i)[0]).attr("cy", (v, i) => point(v, i)[1])
        .attr("r", HIT_R)
        .on("mouseenter", () => setState({ hovered: profile.key }))
        .on("mousemove", (event, v) => showTooltip(event, pointTooltip(profile, v, year)))
        .on("mouseleave", () => { hideTooltip(); setState({ hovered: null }); });
    });
  }

  function drawCard(card) {
    if (!current || !card.width || !card.height) return;
    const radius = Math.max(MIN_RADIUS, Math.min(card.width / 2 - LABEL_ROOM_X, card.height / 2 - LABEL_ROOM_Y));
    const scale = radial.copy().range([0, radius]);
    card.plot.attr("transform", `translate(${card.width / 2},${card.height / 2})`);
    drawAxes(card.axes, scale, line);
    updateShapes(card.shapes, [card.profile], current, scale, currentReference);
  }

  function updateCards(series, state) {
    body.selectAll("section.profile-card").data(series, (d) => d.key).join(
      (enter) => enter.append("section").attr("class", "profile-card")
        .each(function (profile) {
          const element = d3.select(this);
          const title = element.append("h4").attr("class", "profile-card-title");
          title.append("span").attr("class", "swatch");
          title.append("span").attr("class", "profile-country-name");
          element.append("p").attr("class", "profile-summary");
          const svg = element.append("svg").attr("class", "profile-radar").attr("role", "img");
          const plot = svg.append("g");
          const card = { profile, svg, plot, axes: plot.append("g"), shapes: plot.append("g") };
          cards.set(profile.key, card);
          // Disconnect observers when a country leaves the comparison.
          card.observer = new ResizeObserver(([entry]) => {
            card.width = entry.contentRect.width;
            card.height = entry.contentRect.height;
            svg.attr("viewBox", `0 0 ${card.width} ${card.height}`);
            drawCard(card);
          });
          card.observer.observe(svg.node());
        }),
      (update) => update,
      (exit) => exit.each((profile) => {
        cards.get(profile.key).observer.disconnect();
        cards.delete(profile.key);
      }).remove(),
    ).each(function (profile) {
      const element = d3.select(this);
      element.select(".swatch").style("background", profile.color);
      element.select(".profile-country-name").text(profile.name);
      element.select(".profile-summary").text(summaryText(profile));
      const card = cards.get(profile.key);
      card.profile = profile;
      card.svg.attr("aria-label", `${profile.name}, electricity source shares in ${state.year}. All axes range from 0 to ${radial.domain()[1]} percent.`);
      drawCard(card);
    });
  }

  return {
    update(state) {
      current = state;
      const data = comparisonData(state);
      const reference = referenceOf(state);
      currentReference = reference.profile;
      refGroup.selectAll("button").data(reference.options, ([k]) => k).join("button")
        .attr("type", "button")
        .text(([, label]) => label)
        .attr("aria-pressed", ([k]) => String(k === reference.pick))
        .on("click", (_, [k]) => setState({ profileRef: k }));
      // The outer ring is the largest share shown, rounded up, so small shares are not squeezed
      // into the centre. Every axis keeps the same scale, so shapes stay comparable.
      const top = d3.max([...data.series, ...(reference.profile ? [reference.profile] : [])], (p) => d3.max(p.values, (v) => v.share)) ?? 0;
      const maxShare = Math.min(100, Math.max(MIN_MAX_SHARE, Math.ceil(top / RING_STEP) * RING_STEP));
      if (maxShare !== radial.domain()[1]) {
        radial.domain([0, maxShare]);
      }
      updateDescription(state, data, reference);
      updateCards(data.series, state);
    },
  };
}
