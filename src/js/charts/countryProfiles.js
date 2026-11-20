// Country profiles (View C): one radar per compared country, with shared source-share scales.

import { SOURCE_GROUPS, COUNTRY_COMPARE_COLORS, CONTINENT_COLORS } from "../scales.js";
import { comparedSlot, comparisonType, setState } from "../state.js";
import { hideTooltip, showTooltip } from "../tooltip.js";

const LABEL_ROOM_X = 88; // beside the radar, for the axis names
const LABEL_ROOM_Y = 24;
const MIN_RADIUS = 40;
const AXIS_LABEL_OFFSET = 16;
const RING_STEP = 20; // % between rings
const MIN_MAX_SHARE = 40;
const POINT_R = 4;  // 8 px markers
const HIT_R = 10;   // hover zone around each marker

// Source shares use a shared scale across countries; polygon area is not a total.
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
    const label = plot.append("text")
      .attr("class", "profile-axis-label")
      .attr("x", labelX)
      .attr("y", labelY)
      .attr("text-anchor", labelAnchor(labelX));
    const lines = source.key === "bioOther" ? ["Bioenergy", "& other (%)"] : [`${source.label} (%)`];
    label.selectAll("tspan").data(lines).join("tspan")
      .attr("x", labelX)
      .attr("dy", (_, i) => i === 0 ? (lines.length > 1 ? "-0.25em" : "0.35em") : "1.15em")
      .text((text) => text);
  });
}

export function createCountryProfiles(selector, { countries, continents }) {
  const root = d3.select(selector);
  const byCountry = d3.index(countries, (r) => r.key, (r) => r.year);
  const byContinent = d3.index(continents, (r) => r.key, (r) => r.year);
  const names = new Map(countries.map((r) => [r.key, r.name]));
  const note = root.append("p").attr("class", "how-to-read").attr("role", "status");
  const body = root.append("div").attr("class", "profile-body");
  const cards = new Map();
  const radial = d3.scaleLinear().domain([0, 100]);
  const line = d3.line().curve(d3.curveLinearClosed);
  let current = null;

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
    if (!selected.length && state.continent) {
      const record = byContinent.get(state.continent)?.get(state.year);
      const values = sourceProfile(record);
      if (values) series.push({ key: state.continent, name: state.continent, color: CONTINENT_COLORS[state.continent], values });
      else missing.push(state.continent);
    }
    return { selected, missing, series };
  }

  function updateDescription(state, { selected, missing }) {
    d3.select("#profiles-title").text(selected.length
      ? `Electricity mix of the compared countries, ${state.year}`
      : `Electricity mix of ${state.continent ?? "the continent"}, ${state.year}`);
    d3.select("#profiles-description").text(`${selected.length ? "One chart per country." : "Continent energy profile."} Each axis shows a source's share of generation; every chart uses the same 0–${radial.domain()[1]}% scale.`);
    const messages = [];
    if (!selected.length) messages.push("Select countries with + Compare to view their energy profiles (up to four).");
    if (missing.length) messages.push(`No generation data for ${missing.join(", ")} in ${state.year}.`);
    note.text(messages.join(" "));
  }

  function pointTooltip(profile, v, year) {
    return `<strong>${profile.name}, ${year}</strong>`
      + `<div class="tooltip-row"><span>${v.label}</span><span>${v.share.toFixed(1)}%</span></div>`
      + `<div class="tooltip-row"><span>Generation</span><span>${d3.format(",.1f")(v.generation)} TWh</span></div>`;
  }

  function updateShapes(shapes, series, s, scale) {
    const year = s.year;
    const point = (v, i) => axisPoint(i, scale(v.share));
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
        .attr("aria-label", (v) => `${profile.name}, ${year}, ${v.label}: ${v.share.toFixed(1)}%, ${v.generation.toFixed(1)} TWh`);
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
    updateShapes(card.shapes, [card.profile], current, scale);
  }

  function updateCards(series, state) {
    body.selectAll("section.profile-card").data(series, (d) => d.key).join(
      (enter) => enter.append("section").attr("class", "profile-card")
        .each(function (profile) {
          const element = d3.select(this);
          const title = element.append("h4").attr("class", "profile-card-title");
          title.append("span").attr("class", "swatch");
          title.append("span").attr("class", "profile-country-name");
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
      // The outer ring is the largest share shown, rounded up, so small shares are not squeezed
      // into the centre. Every axis keeps the same scale, so shapes stay comparable.
      const top = d3.max(data.series, (p) => d3.max(p.values, (v) => v.share)) ?? 0;
      const maxShare = Math.min(100, Math.max(MIN_MAX_SHARE, Math.ceil(top / RING_STEP) * RING_STEP));
      if (maxShare !== radial.domain()[1]) {
        radial.domain([0, maxShare]);
      }
      updateDescription(state, data);
      updateCards(data.series, state);
    },
  };
}
