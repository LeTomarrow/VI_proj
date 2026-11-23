// View C rows: one row per compared entity (countries or continents), three cells on one shared
// time axis (the range rangeStart-year): mix over time (Q2, countries only), clean vs total
// generation and why emissions changed (T6).
// Reading a year: the hovered row gets one card with the values of its three cells; every other
// row shows its key number at the cursor; the radars above redraw for that year (onPreview).
// Click a cell (or focus it) to pin the year: ← → step, Home/End jump, Esc releases.

import { greenGrowthRows } from "../data/greenGrowth.js";
import { COUNTRY_COMPARE_COLORS, CONTINENT_COLORS, SOURCE_GROUPS } from "../scales.js";
import { comparedSlot, comparisonType, setState } from "../state.js";
import { openEntityMenu } from "../entityMenu.js";
import { hideTooltip, showTooltip } from "../tooltip.js";
import { drawEffects, drawRace, EFFECT_COLORS, EFFECT_LABELS, RACE_COLORS } from "./greenGrowth.js";
import { drawMix, mixRows } from "./mixOverTime.js";
import { compareColumnKeys } from "../data/compare.js";

const MARGIN = { left: 48, right: 18, top: 8, bottom: 20 };
const num = (digits) => (v) => (v === null || v === undefined ? "No data" : d3.format(`,.${digits}f`)(v));
const signed = (v) => (v === null || v === undefined ? "No data" : d3.format("+,.1f")(v));
const short = (v) => d3.format(Math.abs(v) < 10 ? "+.1f" : "+,.0f")(v);
const has = (v) => v !== null && v !== undefined && Number.isFinite(v);
// x domain of every cell: the range, at least one year wide.
const domainOf = (s) => [s.rangeStart, Math.max(s.year, s.rangeStart + 1)];

// Columns: a question as the title, the unit, and a legend of the marks that are not named in
// place (the first row labels its lines: Total, Low-carbon). Continents skip the
// mix (View A's Marimekko already shows it).
const COLUMNS = [
  {
    key: "mix",
    title: "What is it made of?",
    unit: (s) => `kWh per person, ${s.rangeStart}-${s.year} · same scale in every row`,
    legend: [...SOURCE_GROUPS].reverse().map((g) => [g.label, g.color, "area"]),
  },
  {
    key: "race",
    title: "Is clean electricity keeping up?",
    unit: (s) => `TWh added since ${s.rangeStart} · own scale per row`,
    legend: [["clean ahead", RACE_COLORS.lowCarbon, "tint"], ["clean behind", RACE_COLORS.behind, "tint"]],
  },
  {
    key: "effects",
    title: "Why did CO₂e change?",
    unit: (s) => `MtCO₂e since ${s.rangeStart}; below 0 = less CO₂e · own scale per row`,
    legend: [[EFFECT_LABELS.demand, EFFECT_COLORS.demand, "area"], [EFFECT_LABELS.mix, EFFECT_COLORS.mix, "area"]],
  },
];
const columnsFor = (s) => compareColumnKeys(s.compared).map((key) => COLUMNS.find((c) => c.key === key));

export function createCompareRows(selector, { countries, continents, onPreview = () => {} }) {
  const byKey = new Map([
    ...d3.index(countries, (r) => r.key, (r) => r.year),
    ...d3.index(continents, (r) => r.key, (r) => r.year),
  ]);
  const root = d3.select(selector)
    .style("--compare-plot-left", `${MARGIN.left}px`)
    .style("--compare-plot-right", `${MARGIN.right}px`);
  const head = root.append("div").attr("class", "compare-row compare-head");
  const status = root.append("p").attr("class", "how-to-read").attr("role", "status");
  const body = root.append("div").attr("class", "compare-rows");
  const live = root.append("p").attr("class", "sr-only").attr("aria-live", "polite");
  const cells = new Map(); // `${key}|${column}` → { svg, width, height, key, column }
  let view = null; // derived data of the current state
  let hover = null;  // { key, year } under the mouse
  let pinned = null; // { key, year } fixed by a click or the keyboard
  let previewed = null;
  let pointerDown = false; // a click focuses the cell too; the click pins its own year

  function renderHead(columns, s) {
    root.style("--cols", columns.length);
    const items = head.selectAll("div.compare-col-head").data(["label", ...columns], (c) => c.key ?? c).join((enter) => {
      const cell = enter.append("div").attr("class", "compare-col-head")
        .classed("compare-plot-head", (c) => c !== "label");
      cell.filter((c) => c !== "label").each(function (c) {
        const el = d3.select(this);
        el.append("h3").attr("class", "tab-title").text(c.title);
        el.append("p").attr("class", "compare-unit");
        const li = el.append("ul").attr("class", "legend").selectAll("li").data(c.legend).join("li");
        li.append("span").attr("class", ([, , kind]) => `swatch swatch-${kind}`).style("--swatch", ([, color]) => color);
        li.append("span").text(([label]) => label);
      });
      return cell;
    }).order();
    items.select(".compare-unit").text((c) => c.unit?.(s) ?? "");
  }

  function entity(key, s) {
    const records = byKey.get(key) ?? new Map();
    const any = records.values().next().value;
    const color = comparisonType(key) === "continents" ? CONTINENT_COLORS[key] : COUNTRY_COMPARE_COLORS[comparedSlot(key)];
    return {
      key,
      name: any?.name ?? key,
      color,
      mix: mixRows(records, domainOf(s)),
      growth: s.year > s.rangeStart ? greenGrowthRows([...records.values()], s.rangeStart, s.year) : [],
    };
  }

  function drawCell(entityData, column, first) {
    const cell = cells.get(`${entityData.key}|${column}`);
    if (!cell?.width || !cell.height || !view) return;
    const { svg, width, height } = cell;
    svg.selectAll("*").remove();
    const left = MARGIN.left;
    const right = Math.max(left + 1, width - MARGIN.right);
    const top = MARGIN.top;
    const bottom = Math.max(top + 1, height - MARGIN.bottom);
    const g = svg.append("g");
    const { s } = view;

    let x;
    let y;
    if (column === "mix") {
      x = d3.scaleLinear().domain(domainOf(s)).range([left, right]);
      y = d3.scaleLinear().domain([0, view.mixMax]).nice(4).range([bottom, top]);
      drawMix(g, entityData.mix, x, y);
      cell.valueAt = (year) => {
        const total = entityData.mix.find((r) => r.year === year)?.total;
        return has(total) ? `${num(0)(total)} kWh` : "";
      };
    } else {
      const rows = entityData.growth;
      // A cell without a chart: a short message, and no cursor.
      const message = (text) => {
        cell.x = null;
        svg.append("text").attr("class", "how-to-read-svg").attr("x", left).attr("y", height / 2).text(text);
      };
      if (!rows.length) return message("Move the year after the start of the range.");
      const values = column === "race"
        ? rows.flatMap((r) => [r.generation, r.lowCarbon])
        : rows.flatMap((r) => (r.effects ? [r.effects.demand, r.effects.mix, r.effects.net] : []));
      const valid = values.filter((v) => v !== null && Number.isFinite(v));
      if (!valid.length) {
        return message(column === "effects" && s.rangeStart < 2000
          ? "No CO₂e data before 2000: start the range in 2000 or later." : "No data for this period.");
      }
      x = d3.scaleLinear().domain(domainOf(s)).range([left, right]);
      y = d3.scaleLinear().domain([Math.min(0, d3.min(valid)), Math.max(0, d3.max(valid))]).nice(4).range([bottom, top]);
      g.append("line").attr("class", "zero-line").attr("x1", left).attr("x2", right).attr("y1", y(0)).attr("y2", y(0));
      if (column === "race") drawRace(g, rows, x, y, first);
      else drawEffects(g, rows, x, y, first);
      cell.valueAt = (year) => {
        const row = rows.find((r) => r.year === year);
        if (column === "race") {
          return has(row?.lowCarbon) && has(row?.generation) ? `gap ${short(row.lowCarbon - row.generation)} TWh` : "";
        }
        return has(row?.effects?.net) ? `${short(row.effects.net)} Mt` : "";
      };
    }

    const [x0, x1] = x.domain();
    const ticks = x.ticks(Math.max(2, Math.floor((right - left) / 60))).filter(Number.isInteger);
    svg.append("g").attr("class", "axis").attr("transform", `translate(0,${bottom})`)
      .call(d3.axisBottom(x).tickValues(ticks).tickFormat(d3.format("d")).tickSizeOuter(0));
    svg.append("g").attr("class", "axis").attr("transform", `translate(${left},0)`)
      .call(d3.axisLeft(y).ticks(3).tickFormat(d3.format("~s")).tickSizeOuter(0));
    svg.append("line").attr("class", "compare-cursor").attr("y1", top).attr("y2", bottom).attr("visibility", "hidden");
    svg.append("text").attr("class", "cursor-value").attr("y", top + 9).attr("visibility", "hidden");
    cell.x = x;
    cell.top = top;
    const yearAt = (event) => Math.max(x0, Math.min(x1, Math.round(x.invert(d3.pointer(event, svg.node())[0]))));
    svg.append("rect").attr("class", "hit-area").attr("x", left).attr("y", top)
      .attr("width", right - left).attr("height", bottom - top)
      .on("mousemove", (event) => {
        const year = yearAt(event);
        if (hover?.year !== year || hover?.key !== entityData.key) { hover = { key: entityData.key, year }; markHover(); }
        showTooltip(event, card(entityData.key, year));
      })
      .on("mouseleave", () => { hover = null; markHover(); if (pinned) showPinned(); else hideTooltip(); })
      .on("click", (event) => pin({ key: entityData.key, year: yearAt(event) }, false));
    markHover();
  }

  // One card for the whole row at a year: the values of its three cells.
  function card(key, year) {
    const e = view?.entities.find((d) => d.key === key);
    if (!e) return "";
    const { s } = view;
    const row = e.growth.find((r) => r.year === year);
    const line = (label, v, unit, total = false) => `<div class="tooltip-row${total ? " is-total" : ""}"><span>${label}</span>`
      + `<span>${signed(v)}${has(v) ? ` ${unit}` : ""}</span></div>`;
    const section = (title) => `<div class="tooltip-section">${title}</div>`;
    let html = `<strong>${e.name}, ${year}</strong>`;
    if (view.columns.some((c) => c.key === "mix")) {
      const mix = e.mix.find((r) => r.year === year);
      const top3 = SOURCE_GROUPS.filter((src) => mix?.[src.key] > 0).sort((a, b) => mix[b.key] - mix[a.key]).slice(0, 3);
      html += section("Made of (kWh per person)")
        + top3.map((src) => `<div class="tooltip-row"><span><i class="tooltip-swatch" style="background:${src.color}"></i>${src.label}</span><span>${num(0)(mix[src.key])}</span></div>`).join("")
        + `<div class="tooltip-row is-total"><span>Total</span><span>${num(0)(mix?.total)}</span></div>`;
    }
    const gap = has(row?.lowCarbon) && has(row?.generation) ? row.lowCarbon - row.generation : null;
    html += section(`Clean vs total, since ${s.rangeStart}`)
      + line("Total generation", row?.generation, "TWh") + line("Low-carbon", row?.lowCarbon, "TWh")
      + line(gap === null ? "Gap" : gap >= 0 ? "Clean ahead by" : "Clean behind by", gap === null ? null : Math.abs(gap), "TWh", true)
      + section(`Why CO₂e changed, since ${s.rangeStart}`)
      + line(EFFECT_LABELS.demand, row?.effects?.demand, "MtCO₂e") + line(EFFECT_LABELS.mix, row?.effects?.mix, "MtCO₂e")
      + line(EFFECT_LABELS.net, row?.effects?.net, "MtCO₂e", true);
    if (pinned) html += `<div class="tooltip-note">Pinned · ← → year · Esc to release</div>`;
    return html;
  }

  // The same values as one sentence, for screen readers.
  function spoken(key, year) {
    const e = view?.entities.find((d) => d.key === key);
    const row = e?.growth.find((r) => r.year === year);
    if (!e) return "";
    const fx = row?.effects;
    return `${e.name}, ${year}. Since ${view.s.rangeStart}: total generation ${signed(row?.generation)} TWh, low-carbon ${signed(row?.lowCarbon)} TWh.`
      + (fx ? ` CO₂e ${signed(fx.net)} Mt: ${signed(fx.demand)} from how much electricity, ${signed(fx.mix)} from how it is made.` : "");
  }

  // The tooltip of a pinned year, placed at the cursor of the pinned row's last cell.
  function showPinned() {
    const cell = view?.columns.map((c) => cells.get(`${pinned.key}|${c.key}`)).filter((c) => c?.x).at(-1);
    if (!cell) return hideTooltip();
    const box = cell.svg.node().getBoundingClientRect();
    showTooltip({ clientX: box.left + cell.x(pinned.year), clientY: box.top + cell.top }, card(pinned.key, pinned.year));
  }

  function pin(next, announce = true) {
    pinned = next;
    markHover();
    if (!pinned) { hideTooltip(); live.text(""); return; }
    if (announce) showPinned();
    live.text(spoken(pinned.key, pinned.year));
  }

  // The active year (hovered, else pinned) is marked in every cell: a dashed cursor, the year in
  // the active row and each other row's key number next to it. The radars follow it.
  function markHover() {
    const active = hover ?? pinned;
    for (const cell of cells.values()) {
      if (!cell.x) continue;
      const [lo, hi] = cell.x.domain();
      const on = !!active && active.year >= lo && active.year <= hi;
      const at = on ? cell.x(active.year) : 0;
      cell.svg.classed("is-reading", on);
      cell.svg.select(".compare-cursor").attr("visibility", on ? "visible" : "hidden").attr("x1", at).attr("x2", at);
      const label = cell.svg.select(".cursor-value").attr("visibility", on ? "visible" : "hidden")
        .classed("is-year", on && cell.key === active.key)
        .text(on ? (cell.key === active.key ? String(active.year) : cell.valueAt?.(active.year) ?? "") : "");
      // Right of the cursor when it fits, else left of it, never past the plot.
      const [left, right] = cell.x.range();
      const width = on ? label.node().getComputedTextLength() : 0;
      const after = at + 4 + width <= right + MARGIN.right;
      label.attr("text-anchor", after ? "start" : "end")
        .attr("x", after ? at + 4 : Math.max(left + width, at - 4));
    }
    body.selectAll("div.compare-row").classed("is-hovered", (e) => e.key === (active?.key ?? view?.s.hovered));
    const key = active ? `${active.key}|${active.year}` : null;
    if (key !== previewed && view) {
      previewed = key;
      onPreview(active ? { ...view.s, year: active.year, hovered: active.key } : view.s);
    }
  }

  function onKey(event, key) {
    const [lo, hi] = domainOf(view.s);
    const year = pinned?.key === key ? pinned.year : hi;
    const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    if (step) pin({ key, year: Math.max(lo, Math.min(hi, year + step)) });
    else if (event.key === "Home") pin({ key, year: lo });
    else if (event.key === "End") pin({ key, year: hi });
    else if (event.key === "Escape") { pin(null); event.target.blur(); }
    else return;
    event.preventDefault();
  }

  // A row leaves: its cells stop observing their size and are forgotten.
  function dropRow(key) {
    for (const c of COLUMNS) {
      cells.get(`${key}|${c.key}`)?.observer?.disconnect();
      cells.delete(`${key}|${c.key}`);
    }
  }

  function redraw() {
    if (!view) return;
    view.entities.forEach((e, i) => { for (const column of view.columns) drawCell(e, column.key, i === 0); });
  }

  return {
    update(s) {
      const entities = s.compared.map((key) => entity(key, s));
      const mixMax = d3.max(entities, (e) => d3.max(e.mix, (r) => r.total)) || 1;
      const columns = columnsFor(s);
      // A new column set (countries ↔ continents) rebuilds the rows.
      const signature = columns.map((c) => c.key).join();
      if (view && view.signature !== signature) body.selectAll("div.compare-row").each((e) => dropRow(e.key)).remove();
      view = { s, entities, mixMax, columns, signature };
      if (pinned && !s.compared.includes(pinned.key)) pinned = null;
      if (hover && !s.compared.includes(hover.key)) hover = null;
      const [lo, hi] = domainOf(s);
      if (pinned) pinned.year = Math.max(lo, Math.min(hi, pinned.year));
      previewed = null;
      renderHead(columns, s);
      status.text(entities.length ? "" : "The comparison is empty: click a country or a continent, then + Compare.");

      body.selectAll("div.compare-row").data(entities, (e) => e.key).join(
        (enter) => enter.append("div").attr("class", "compare-row is-entering").each(function (e) {
          const row = d3.select(this);
          const label = row.append("button").attr("type", "button").attr("class", "compare-label is-clickable")
            .on("click", (event) => openEntityMenu(event, e.key, e.name))
            .on("mouseenter", () => setState({ hovered: e.key }))
            .on("mouseleave", () => setState({ hovered: null }));
          label.append("span").attr("class", "swatch");
          label.append("span").attr("class", "compare-name");
          for (const column of columns) {
            const svg = row.append("div").attr("class", "compare-cell").append("svg").attr("role", "img")
              .attr("tabindex", 0)
              .on("focus", () => {
                if (pinned?.key !== e.key && !pointerDown) pin({ key: e.key, year: domainOf(view.s)[1] });
                pointerDown = false;
              })
              .on("blur", () => pin(null))
              .on("keydown", (event) => onKey(event, e.key))
              .on("pointerdown", () => { pointerDown = true; });
            const cell = { svg, width: 0, height: 0, key: e.key, column: column.key };
            cells.set(`${e.key}|${column.key}`, cell);
            cell.observer = new ResizeObserver(([entry]) => {
              const { width, height } = entry.contentRect;
              if (!width || !height) return;
              cell.width = width;
              cell.height = height;
              svg.attr("viewBox", `0 0 ${width} ${height}`);
              const at = view?.entities.findIndex((d) => d.key === e.key) ?? -1;
              if (at >= 0) drawCell(view.entities[at], column.key, at === 0);
            });
            cell.observer.observe(svg.node());
          }
          // Next frame: the row fades and rises in (View C entrance; style.css turns it off for reduced motion).
          requestAnimationFrame(() => row.classed("is-entering", false));
        }),
        (update) => update,
        (exit) => exit.each((e) => dropRow(e.key)).remove(),
      ).each(function (e, i) {
        const row = d3.select(this);
        row.style("--stagger", `${i * 60}ms`);
        row.classed("is-hovered", e.key === ((hover ?? pinned)?.key ?? s.hovered));
        row.select(".swatch").style("background", e.color);
        row.select(".compare-name").text(e.name);
        for (const column of columns) {
          cells.get(`${e.key}|${column.key}`)?.svg
            .attr("aria-label", `${e.name}: ${column.title} Focus, then ← → to read the values year by year.`);
        }
      }).order();
      redraw();
    },
  };
}
