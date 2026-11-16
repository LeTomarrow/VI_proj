// Columns of View B's mix chart (bars + mix), in the order of the chosen ranking (rank, from RANKS
// in scales.js). rankedColumns: the continent's ranked top N, then the compared countries outside
// it; comparedColumns: the compared countries only, from any continent.

import { metricValue } from "./metrics.js";

// The continent's countries with generation in the selected year, from the highest ranked value
// (ties: the larger total first).
function byRank(byCountry, keys, rank, s) {
  return keys.map((k) => byCountry.get(k)?.get(s.year))
    .filter((r) => r?.generation > 0)
    .sort((a, b) => rank.value(b) - rank.value(a) || b.generation - a.generation);
}

// Top N by the ranked value (only countries that have some), then the compared countries outside
// it. position: rank of each shown country among the continent's countries.
export function rankedColumns({ byCountry, keys, compared, rank }, s, n) {
  const ofYear = byRank(byCountry, keys, rank, s);
  const top = ofYear.filter((r) => rank.value(r) > 0).slice(0, n);
  const extra = ofYear.filter((r) => compared.includes(r.key) && !top.includes(r));
  const shown = [...top, ...extra];
  return {
    records: top,
    extra,
    stats: new Map(shown.map((r) => [r.key, metricValue(byCountry.get(r.key), s)])),
    position: new Map(shown.map((r) => [r.key, ofYear.indexOf(r) + 1])),
    total: ofYear.length,
  };
}

// The compared countries (any continent) with data in the selected year, from the highest ranked
// value. position: rank of each one among the countries of its own continent.
export function comparedColumns({ byCountry, countriesOf, compared, rank }, s) {
  const records = byRank(byCountry, compared, rank, s);
  const position = new Map(records.map((r) => {
    const ofContinent = byRank(byCountry, countriesOf.get(r.continent) ?? [], rank, s);
    return [r.key, ofContinent.findIndex((o) => o.key === r.key) + 1];
  }));
  return {
    records,
    extra: [],
    stats: new Map(records.map((r) => [r.key, metricValue(byCountry.get(r.key), s)])),
    position,
    total: records.length,
  };
}

// Largest ranked value of any of the countries in any year: the bars keep one scale over the
// years, so a taller bar means growth (U5).
export function rankMax(byCountry, keys, rank) {
  return d3.max(keys, (k) => d3.max(byCountry.get(k)?.values() ?? [], rank.value)) ?? 0;
}
