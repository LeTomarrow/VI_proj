import { greenGrowthRows } from "../data/greenGrowth.js";
import { YEARS } from "../data/constants.js";
import { setState } from "../state.js";
import { hideTooltip, showTooltip } from "../tooltip.js";
import { fitToSize } from "./fitToSize.js";

const COLORS = { generation: "#e18a24", lowCarbon: "#23834b", net: "#242424", red: "#c34b49" };
const MARGIN = { left: 66, right: 24, top: 24, bottom: 32 };
const format = (v) => d3.format("+.2f")(v);

// Insert intersections so the difference shading changes colour exactly at a crossing.
function withCrossings(rows) {
  return rows.flatMap((row, i) => {
    const next = rows[i + 1];
    if (row.generation === null || !next || next.generation === null) return [row];
    const a = row.lowCarbon - row.generation;
    const b = next.lowCarbon - next.generation;
    if (a * b >= 0) return [row];
    const t = a / (a - b);
    const generation = row.generation + t * (next.generation - row.generation);
    return [row, { year: row.year + t, generation, lowCarbon: generation }];
  });
}

export function createGreenGrowth(selector, { countries }) {
  const byCountry = d3.group(countries, (r) => r.key);
  const root = d3.select(selector).classed("green-growth-charts", true);
  const startInput = d3.select("#green-growth-start");
  let current;
  let rows = [];
  let hoverYear = null;
  const panels = [
    { title: "Is low-carbon electricity keeping up?", unit: "Change in generation (TWh)",
      note: "Orange = total generation; green = nuclear + renewables. Green gap = low-carbon growth exceeds total growth; red = it falls short." },
    { title: "Why have electricity emissions changed?", unit: "Change in emissions (MtCO₂e)",
      note: "Orange bars = generation effect; green bars = mix effect; black line = their sum. Below zero means an emissions reduction." },
  ].map((definition) => {
    const section = root.append("section").attr("class", "green-growth-panel");
    section.append("h3").attr("class", "tab-title").text(definition.title);
    section.append("p").attr("class", "how-to-read").text(definition.note);
    const status = section.append("p").attr("class", "how-to-read").attr("role", "status");
    const svg = section.append("svg").attr("role", "img");
    const panel = { ...definition, status, svg, width: 0, height: 0 };
    fitToSize(svg, (width, height) => {
      panel.width = width;
      panel.height = height;
      draw();
    });
    return panel;
  });

  d3.select("#close-green-growth").on("click", () => {
    hideTooltip();
    setState({ greenGrowthCountry: null, hovered: null });
    const tab = document.querySelector("#tab-scatter");
    tab?.click();
    tab?.focus();
  });
  startInput.on("change", (event) => {
    const value = Number(event.target.value);
    if (!event.target.value || !Number.isInteger(value)) {
      event.target.value = current.rangeStart;
      return;
    }
    setState({ rangeStart: Math.max(YEARS[0], Math.min(current.year, value)) });
  });

  function markHover() {
    for (const panel of panels) {
      if (!panel.x) continue;
      panel.svg.select(".growth-cursor")
        .attr("visibility", hoverYear === null ? "hidden" : "visible")
        .attr("x1", panel.x(hoverYear)).attr("x2", panel.x(hoverYear));
    }
  }

  function draw() {
    if (!current?.greenGrowthCountry) return;
    const name = byCountry.get(current.greenGrowthCountry)?.[0]?.name ?? current.greenGrowthCountry;
    const start = current.rangeStart;
    const end = current.year;
    if (end < start) {
      for (const panel of panels) {
        panel.svg.selectAll("*").remove();
        panel.status.text("Choose a start year no later than the end year, or move the year slider forward.");
      }
      return;
    }
    const raceExists = rows.some((r) => r.generation !== null);
    const emissionsExist = rows.some((r) => r.effects);
    panels[0].status.text(!raceExists ? `Generation data unavailable for the selected baseline (${start}) or period.`
      : rows.some((r) => r.generation === null) ? "Gaps indicate missing generation data." : "");
    panels[1].status.text(start < 2000 ? "Emissions data starts in 2000. Choose a start year of 2000 or later."
      : !emissionsExist ? `Emissions decomposition unavailable for the selected baseline (${start}) or period.`
        : rows.some((r) => !r.effects) ? "Gaps indicate missing emissions data." : "");

    panels.forEach((panel, index) => {
      if (!panel.width || !panel.height) return;
      const svg = panel.svg;
      svg.selectAll("*").remove();
      svg.attr("aria-label", `${name}: ${panel.title} ${start}–${end}. ${panel.unit}.`);
      const left = MARGIN.left;
      const right = Math.max(left + 1, panel.width - MARGIN.right);
      const top = MARGIN.top;
      const bottom = Math.max(top + 1, panel.height - MARGIN.bottom);
      const x = d3.scaleLinear().domain([start - 0.5, end + 0.5]).range([left, right]);
      panel.x = x;
      const values = index === 0 ? rows.flatMap((r) => [r.generation, r.lowCarbon])
        : rows.flatMap((r) => r.effects ? Object.values(r.effects) : []);
      const valid = values.filter((v) => v !== null && Number.isFinite(v));
      const lo = Math.min(0, d3.min(valid) ?? 0);
      const hi = Math.max(0, d3.max(valid) ?? 0);
      const padding = (hi - lo || 1) * 0.08;
      const y = d3.scaleLinear().domain([lo - padding, hi + padding]).nice().range([bottom, top]);
      const ticks = x.ticks(Math.max(2, Math.floor((right - left) / 75))).filter(Number.isInteger);
      svg.append("g").attr("class", "axis").attr("transform", `translate(0,${bottom})`)
        .call(d3.axisBottom(x).tickValues(ticks).tickFormat(d3.format("d")));
      svg.append("g").attr("class", "axis").attr("transform", `translate(${left},0)`)
        .call(d3.axisLeft(y).ticks(5));
      svg.append("text").attr("class", "axis-title").attr("x", left).attr("y", 12).text(panel.unit);
      svg.append("line").attr("class", "zero-line").attr("x1", left).attr("x2", right)
        .attr("y1", y(0)).attr("y2", y(0));

      if (index === 0) {
        const area = d3.area().defined((r) => r.generation !== null)
          .x((r) => x(r.year)).y0((r) => y(r.generation));
        const shaded = withCrossings(rows);
        svg.append("path").datum(shaded).attr("fill", COLORS.lowCarbon).attr("fill-opacity", 0.2)
          .attr("d", area.y1((r) => y(Math.max(r.generation, r.lowCarbon))));
        svg.append("path").datum(shaded).attr("fill", COLORS.red).attr("fill-opacity", 0.2)
          .attr("d", area.y1((r) => y(Math.min(r.generation, r.lowCarbon))));
        for (const key of ["generation", "lowCarbon"]) {
          svg.append("path").datum(rows).attr("fill", "none").attr("stroke", COLORS[key]).attr("stroke-width", 2)
            .attr("d", d3.line().defined((r) => r[key] !== null).x((r) => x(r.year)).y((r) => y(r[key])));
        }
      } else if (start >= 2000) {
        const band = Math.min(28, (right - left) / Math.max(1, rows.length) * 0.8);
        for (const [key, offset, color] of [["demand", -band / 2, COLORS.generation], ["mix", 0, COLORS.lowCarbon]]) {
          svg.append("g").selectAll("rect").data(rows.filter((r) => r.effects)).join("rect")
            .attr("x", (r) => x(r.year) + offset).attr("width", band / 2)
            .attr("y", (r) => y(Math.max(0, r.effects[key])))
            .attr("height", (r) => Math.abs(y(r.effects[key]) - y(0))).attr("fill", color);
        }
        svg.append("path").datum(rows).attr("fill", "none").attr("stroke", COLORS.net).attr("stroke-width", 2)
          .attr("d", d3.line().defined((r) => !!r.effects).x((r) => x(r.year)).y((r) => y(r.effects.net)));
        svg.append("g").selectAll("circle").data(rows.filter((r) => r.effects)).join("circle")
          .attr("cx", (r) => x(r.year)).attr("cy", (r) => y(r.effects.net)).attr("r", 2.5).attr("fill", COLORS.net);
      }
      svg.append("line").attr("class", "growth-cursor").attr("stroke", "#777")
        .attr("stroke-dasharray", "3 3").attr("y1", top).attr("y2", bottom).attr("pointer-events", "none");
      svg.append("rect").attr("x", left).attr("y", top).attr("width", right - left).attr("height", bottom - top)
        .attr("fill", "transparent")
        .on("mousemove", (event) => {
          const year = Math.max(start, Math.min(end, Math.round(x.invert(d3.pointer(event, svg.node())[0]))));
          hoverYear = year;
          markHover();
          const row = rows.find((r) => r.year === year);
          const entry = (label, value, unit) => `<div class="tooltip-row"><span>${label}</span><span>${value === null ? "No data" : `${format(value)} ${unit}`}</span></div>`;
          showTooltip(event, `<strong>${name}, ${year}</strong><div class="tooltip-note">Change since ${start}</div>`
            + entry("Total generation", row.generation, "TWh") + entry("Low-carbon generation", row.lowCarbon, "TWh")
            + entry("Generation effect", row.effects?.demand ?? null, "MtCO₂e")
            + entry("Mix effect", row.effects?.mix ?? null, "MtCO₂e")
            + entry("Net emissions change", row.effects?.net ?? null, "MtCO₂e"));
        })
        .on("mouseleave", () => { hoverYear = null; markHover(); hideTooltip(); });
    });
    markHover();
  }

  return {
    update(state) {
      current = state;
      if (!state.greenGrowthCountry) return;
      const records = byCountry.get(state.greenGrowthCountry) ?? [];
      const name = records[0]?.name ?? state.greenGrowthCountry;
      d3.select("#green-growth-title").text(`${name}: green growth, ${state.rangeStart}–${state.year}`);
      startInput.attr("max", state.year).property("value", state.rangeStart);
      rows = greenGrowthRows(records, state.rangeStart, state.year);
      hoverYear = null;
      draw();
    },
  };
}
