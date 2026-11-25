// Value of a metric for one entity in the Year or Change mode.
// Rules: docs/iteration1/02-visualization-choices.md (View 1).

// byYear: Map year → record of one entity. Returns the value, how many years of the range have
// data, and whether any year used is partial (below the coverage threshold).
export function metricValue(byYear, { metric, mode, year, rangeStart }) {
  const at = (y) => byYear.get(y)?.[metric] ?? null;
  const years = mode === "change" ? [rangeStart, year] : [year];
  const values = years.map(at).filter((v) => v !== null);
  const partial = years.some((y) => byYear.get(y)?.partial);

  let value = null;
  if (mode === "year") value = at(year);
  else if (mode === "change" && values.length === 2) value = at(year) - at(rangeStart);

  return { value, partial, yearsWithData: values.length, yearsTotal: years.length, record: byYear.get(year) ?? null };
}
