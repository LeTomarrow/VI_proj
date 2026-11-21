// Mix over time of one entity (View C, question Q2): stacked area by source in kWh per person,
// so large and small countries share one scale and growth stays visible (U5).

import { SOURCE_GROUPS } from "../scales.js";

// One row per year: kWh per person of each source group, and the total.
export function mixRows(records, [first, last]) {
  return d3.range(first, last + 1).map((year) => {
    const r = records.get(year);
    const ok = r?.population > 0 && r.generation > 0;
    const row = { year, total: ok ? (r.generation * 1e9) / r.population : null };
    for (const g of SOURCE_GROUPS) row[g.key] = ok ? (d3.sum(g.parts, (k) => r.sources[k]) * 1e9) / r.population : 0;
    return row;
  });
}

export function drawMix(g, rows, x, y) {
  const stack = d3.stack().keys(SOURCE_GROUPS.map((s) => s.key))(rows);
  const area = d3.area()
    .defined((d) => d.data.total !== null)
    .x((d) => x(d.data.year)).y0((d) => y(d[0])).y1((d) => y(d[1]));
  g.append("g").selectAll("path").data(stack).join("path")
    .attr("class", "mix-band")
    .attr("fill", (d) => SOURCE_GROUPS.find((s) => s.key === d.key).color)
    .attr("d", area);
}
