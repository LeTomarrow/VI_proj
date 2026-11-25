// A comparison card describes one chart; the shared year cursor is handled by compareRows.
import { SOURCE_GROUPS } from "../scales.js";
import { EFFECT_LABELS } from "./greenGrowth.js";

const has = (v) => v !== null && v !== undefined && Number.isFinite(v);
const signed = (v) => has(v) ? d3.format("+,.1f")(v) : "No data";
const num = (v) => has(v) ? d3.format(",.0f")(v) : "No data";

export function comparisonTooltip(entity, column, year, start, pinned = false) {
  if (!entity) return "";
  const row = entity.growth.find((r) => r.year === year);
  const line = (label, v, unit, total = false) => `<div class="tooltip-row${total ? " is-total" : ""}"><span>${label}</span>`
    + `<span>${signed(v)}${has(v) ? ` ${unit}` : ""}</span></div>`;
  const section = (title) => `<div class="tooltip-section">${title}</div>`;
  let html = `<strong>${entity.name}, ${year}</strong>`;
  if (column === "mix") {
    const mix = entity.mix.find((r) => r.year === year);
    const top3 = SOURCE_GROUPS.filter((src) => mix?.[src.key] > 0).sort((a, b) => mix[b.key] - mix[a.key]).slice(0, 3);
    html += section("Made of (kWh per person)")
      + top3.map((src) => `<div class="tooltip-row"><span><i class="tooltip-swatch" style="background:${src.color}"></i>${src.label}</span><span>${num(mix[src.key])}</span></div>`).join("")
      + `<div class="tooltip-row is-total"><span>Total</span><span>${num(mix?.total)}</span></div>`;
  } else if (column === "race") {
    const gap = has(row?.lowCarbon) && has(row?.generation) ? row.lowCarbon - row.generation : null;
    html += section(`Clean vs total, since ${start}`)
      + line("Total generation", row?.generation, "TWh") + line("Low-carbon", row?.lowCarbon, "TWh")
      + line(gap === null ? "Gap" : gap >= 0 ? "Clean ahead by" : "Clean behind by", gap === null ? null : Math.abs(gap), "TWh", true);
  } else if (column === "effects") {
    html += section(`Why CO₂e changed, since ${start}`)
      + line(EFFECT_LABELS.demand, row?.effects?.demand, "MtCO₂e") + line(EFFECT_LABELS.mix, row?.effects?.mix, "MtCO₂e")
      + line(EFFECT_LABELS.net, row?.effects?.net, "MtCO₂e", true);
  }
  if (pinned) html += `<div class="tooltip-note">Pinned · ← → year · Esc to release</div>`;
  return html;
}
