// Columns of View B's Marimekko: the continent's top countries by generation in the selected
// year (at most 10, and only those wide enough to read), the compared countries outside them, and "Others" (the rest, summed).

import { metricValue } from "./metrics.js";
import { sumCountries } from "./aggregate.js";

export const TOP_COUNTRIES = 10;
export const OTHERS = "Others";

// byCountry: key → year → record. keys: the continent's countries. minGeneration: the smallest
// total (TWh) whose column is wide enough to read. Returns the records in column order and the
// stat of each column for the top strip.
export function countryColumns({ byCountry, keys, continent, compared, expanded, minGeneration = 0 }, s) {
  const ofYear = keys.map((k) => byCountry.get(k)?.get(s.year))
    .filter((r) => r?.generation > 0)
    .sort((a, b) => b.generation - a.generation);

  const shown = expanded ? ofYear
    : ofYear.filter((r, i) => (i < TOP_COUNTRIES && r.generation >= minGeneration) || compared.includes(r.key));
  const rest = ofYear.filter((r) => !shown.includes(r));

  const stats = new Map(shown.map((r) => [r.key, metricValue(byCountry.get(r.key), s)]));
  const records = [...shown];
  // Others sums the same countries in every year, so Range average and Change compare like with like.
  if (rest.length > 1) {
    const restKeys = rest.map((r) => r.key);
    const years = s.mode === "year" ? [s.year] : d3.range(s.rangeStart, s.year + 1);
    const byYear = new Map();
    for (const year of years) {
      const rows = restKeys.map((k) => byCountry.get(k)?.get(year)).filter(Boolean);
      if (rows.length) byYear.set(year, sumCountries({ key: OTHERS, name: OTHERS, continent }, year, rows));
    }
    const others = { ...byYear.get(s.year), count: rest.length };
    byYear.set(s.year, others);
    records.push(others);
    stats.set(OTHERS, metricValue(byYear, s));
  } else {
    records.push(...rest);
    for (const r of rest) stats.set(r.key, metricValue(byCountry.get(r.key), s));
  }
  return { records, stats, total: ofYear.length };
}
