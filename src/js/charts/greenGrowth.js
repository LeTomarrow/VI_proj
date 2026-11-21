// The two "green growth" cells of a View C row (task T6), drawn for one entity:
// drawRace: is low-carbon generation keeping up with total generation? (difference chart)
// drawEffects: why did emissions change? (LMDI decomposition, data/greenGrowth.js)
//   Base example: Bars and line (https://observablehq.com/@recifs/plot-bars-and-line).
// First built by Tomás as a single-country mode; now one row per compared entity.

// Blue = low-carbon (and the shading where it grew more), red = it fell short (the Change
// scale, not green/red).
export const RACE_COLORS = { total: "#52514e", lowCarbon: "#2166ac", behind: "#b2182b" };
// Two neutral categorical colours, named in place; the sign of the bar gives the direction.
export const EFFECT_COLORS = { demand: "#e18a24", mix: "#6f8fb8", net: "#0b0b0b" };
// Legend and tooltip words, short enough for one line.
export const EFFECT_LABELS = { demand: "More or less electricity", mix: "Different way of making it", net: "Total change" };

// Names at the right end of the lines (first row only), moved apart when they would overlap.
function endLabels(g, items, x) {
  const shown = items.filter((d) => Number.isFinite(d.y)).sort((a, b) => a.y - b.y);
  for (let i = 1; i < shown.length; i++) shown[i].y = Math.max(shown[i].y, shown[i - 1].y + 11);
  g.selectAll("text.end-label").data(shown).join("text").attr("class", "end-label")
    .attr("x", x.range()[1] - 2).attr("y", (d) => d.y - 6).attr("text-anchor", "end")
    .attr("fill", (d) => d.color).text((d) => d.text);
}
const lastWith = (rows, ok) => [...rows].reverse().find(ok);

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

// rows: greenGrowthRows(); x, y: scales of the cell; g: the plot group.
export function drawRace(g, rows, x, y, labels = false) {
  const area = d3.area().defined((r) => r.generation !== null).x((r) => x(r.year)).y0((r) => y(r.generation));
  const shaded = withCrossings(rows);
  g.append("path").datum(shaded).attr("fill", RACE_COLORS.lowCarbon).attr("fill-opacity", 0.18)
    .attr("d", area.y1((r) => y(Math.max(r.generation, r.lowCarbon))));
  g.append("path").datum(shaded).attr("fill", RACE_COLORS.behind).attr("fill-opacity", 0.18)
    .attr("d", area.y1((r) => y(Math.min(r.generation, r.lowCarbon))));
  for (const [key, color, dash] of [["generation", RACE_COLORS.total, "4 3"], ["lowCarbon", RACE_COLORS.lowCarbon, null]]) {
    g.append("path").datum(rows).attr("fill", "none").attr("stroke", color).attr("stroke-width", 2)
      .attr("stroke-dasharray", dash)
      .attr("d", d3.line().defined((r) => r[key] !== null).x((r) => x(r.year)).y((r) => y(r[key])));
  }
  const last = lastWith(rows, (r) => r.generation !== null);
  if (labels && last) {
    endLabels(g, [
      { text: "Total", y: y(last.generation), color: RACE_COLORS.total },
      { text: "Low-carbon", y: y(last.lowCarbon), color: RACE_COLORS.lowCarbon },
    ], x);
  }
}

export function drawEffects(g, rows, x, y, labels = false) {
  const withEffects = rows.filter((r) => r.effects);
  const step = withEffects.length > 1 ? Math.abs(x(withEffects[1].year) - x(withEffects[0].year)) : 20;
  const band = Math.max(2, Math.min(16, step * 0.8));
  for (const [key, offset] of [["demand", -band / 2], ["mix", 0]]) {
    g.append("g").selectAll("rect").data(withEffects).join("rect")
      .attr("x", (r) => x(r.year) + offset).attr("width", band / 2)
      .attr("y", (r) => y(Math.max(0, r.effects[key])))
      .attr("height", (r) => Math.abs(y(r.effects[key]) - y(0)))
      .attr("fill", EFFECT_COLORS[key]);
  }
  g.append("path").datum(rows).attr("fill", "none").attr("stroke", EFFECT_COLORS.net).attr("stroke-width", 1.5)
    .attr("d", d3.line().defined((r) => !!r.effects).x((r) => x(r.year)).y((r) => y(r.effects.net)));
  const last = lastWith(rows, (r) => r.effects);
  if (labels && last) endLabels(g, [{ text: "Total", y: y(last.effects.net), color: EFFECT_COLORS.net }], x);
}
