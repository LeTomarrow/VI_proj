import { SOURCE_GROUPS, COUNTRY_COMPARE_COLORS } from "../scales.js";
import { comparisonType } from "../state.js";

const CHART_WIDTH = 700;
const CHART_HEIGHT = 460;
const RADIUS = 155;
const AXIS_LABEL_OFFSET = 32;
const GRID_SHARES = [20, 40, 60, 80, 100];
const WORLD_COLOR = "#6f6d68";

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
  for (const value of GRID_SHARES) {
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
    const [x, y] = axisPoint(index, RADIUS);
    const [labelX, labelY] = axisPoint(index, RADIUS + AXIS_LABEL_OFFSET);
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
  const legend = root.append("ul").attr("class", "legend profile-legend").attr("aria-label", "Country colours");
  const svg = root.append("svg").attr("class", "profile-radar")
    .attr("viewBox", `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`).attr("role", "img");
  const plot = svg.append("g")
    .attr("transform", `translate(${CHART_WIDTH / 2},${CHART_HEIGHT / 2})`);
  const radial = d3.scaleLinear().domain([0, 100]).range([0, RADIUS]);
  const line = d3.line().curve(d3.curveLinearClosed);
  drawAxes(plot, radial, line);
  const shapes = plot.append("g");

  function comparisonData(state) {
    const selected = state.compared.filter((key) => comparisonType(key) === "countries");
    const missing = [];
    const series = selected.flatMap((key, i) => {
      const record = byCountry.get(key)?.get(state.year);
      const values = sourceProfile(record);
      if (!values) {
        missing.push(names.get(key) ?? key);
        return [];
      }
      return [{ key, name: record.name, color: COUNTRY_COMPARE_COLORS[i], values }];
    });
    const reference = sourceProfile(byWorld.get(state.year));
    if (reference && selected.length) {
      series.unshift({ key: "World", name: "World", color: WORLD_COLOR, values: reference });
    }
    return { selected, missing, series, reference };
  }

  function updateDescription(state, { selected, missing, series, reference }) {
    d3.select("#profiles-description").text(`Electricity generation by source, ${state.year}. Each axis shows its share of total generation (0–100%). Grey dashed line = World. Hover or focus a point for values.`);
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

  function updateShapes(series, year) {
    const groups = shapes.selectAll("g").data(series, (d) => d.key).join("g").order();
    groups.each(function (profile) {
      const group = d3.select(this);
      group.selectAll("path").data([profile]).join("path")
        .attr("d", line(profile.values.map((v, i) => axisPoint(i, radial(v.share)))))
        .attr("fill", profile.color).attr("fill-opacity", profile.key === "World" ? 0 : 0.14)
        .attr("stroke", profile.color).attr("stroke-width", 2)
        .attr("stroke-dasharray", profile.key === "World" ? "5 4" : null);
      group.selectAll("circle").data(profile.values).join("circle")
        .attr("cx", (v, i) => axisPoint(i, radial(v.share))[0])
        .attr("cy", (v, i) => axisPoint(i, radial(v.share))[1])
        .attr("r", 2.5).attr("fill", profile.color).attr("tabindex", 0)
        .attr("aria-label", (v) => `${profile.name}, ${year}, ${v.label}: ${v.share.toFixed(1)}%, ${v.generation.toFixed(2)} TWh`)
        .each(function (v) {
          d3.select(this).selectAll("title").data([v]).join("title")
            .text(`${profile.name} · ${year}\n${v.label}: ${v.share.toFixed(1)}%\nGeneration: ${v.generation.toFixed(2)} TWh`);
        });
    });
  }

  return {
    update(state) {
      const data = comparisonData(state);
      updateDescription(state, data);
      updateLegend(legend, data.series);
      updateShapes(data.series, state.year);
    },
  };
}
