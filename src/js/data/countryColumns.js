// Columns of View B's Marimekko. Folded: the continent's largest countries by generation in the
// selected year (at most 10, and only those wide enough to read), the compared countries outside
// them, and "Others" (the rest, summed). Expanded, the inverse: the largest countries are summed
// into one "Largest" column and every other country gets its own column.

import { metricValue } from "./metrics.js";
import { sumCountries } from "./aggregate.js";

export const TOP_COUNTRIES = 10;
export const OTHERS = "Others";
export const LARGEST = "Largest";

// One column that sums the same countries in every year, so Range average and Change compare
// like with like. Returns the record of the selected year and its stat.
function summed(key, members, { byCountry, continent }, s) {
  const keys = members.map((r) => r.key);
  const years = s.mode === "year" ? [s.year] : d3.range(s.rangeStart, s.year + 1);
  const byYear = new Map();
  for (const year of years) {
    const rows = keys.map((k) => byCountry.get(k)?.get(year)).filter(Boolean);
    if (rows.length) byYear.set(year, sumCountries({ key, name: key, continent }, year, rows));
  }
  const record = { ...byYear.get(s.year), count: members.length, members: members.map((r) => r.name), memberKeys: keys };
  byYear.set(s.year, record);
  return { record, stat: metricValue(byYear, s) };
}

// byCountry: key → year → record. keys: the continent's countries. minGeneration: the smallest
// total (TWh) whose column is wide enough to read when folded. Returns the records in column
// order and the stat of each column for the top strip.
export function countryColumns(input, s) {
  const { byCountry, keys, compared, expanded, minGeneration = 0 } = input;
  const ofYear = keys.map((k) => byCountry.get(k)?.get(s.year))
    .filter((r) => r?.generation > 0)
    .sort((a, b) => b.generation - a.generation);
  const largest = ofYear.filter((r, i) => i < TOP_COUNTRIES && r.generation >= minGeneration);

  // Compared countries keep their own column in both states.
  const grouped = expanded
    ? largest.filter((r) => !compared.includes(r.key))
    : ofYear.filter((r) => !largest.includes(r) && !compared.includes(r.key));
  const own = ofYear.filter((r) => !grouped.includes(r));

  const stats = new Map(own.map((r) => [r.key, metricValue(byCountry.get(r.key), s)]));
  let records = [...own];
  if (grouped.length > 1) {
    const key = expanded ? LARGEST : OTHERS;
    const { record, stat } = summed(key, grouped, input, s);
    records = expanded ? [record, ...own] : [...own, record];
    stats.set(key, stat);
  } else {
    records = ofYear;
    for (const r of grouped) stats.set(r.key, metricValue(byCountry.get(r.key), s));
  }
  return { records, stats, total: ofYear.length };
}
