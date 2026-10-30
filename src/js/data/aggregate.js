// Continent values = sum of their countries, so a continent always equals the sum of its
// drill-down countries (docs/iteration2/01-integration-plan.md, decision log).

import { CONTINENTS, COMPLETE_YEARS, COVERAGE_THRESHOLD, SOURCES } from "./constants.js";
import { deriveRecord } from "./preprocess.js";

// Shares and carbon intensity are recomputed from the sums by deriveRecord, never averaged.
// Emissions are left null unless every country in the sum reports them, because carbon
// intensity divides them by the total generation (before 2000 no country reports them).
function sumCountries(continent, year, rows) {
  const sources = Object.fromEntries(Object.keys(SOURCES).map((k) => [k, d3.sum(rows, (r) => r.sources[k])]));
  const allEmissions = rows.every((r) => r.emissions !== null);
  return deriveRecord({
    key: continent,
    name: continent,
    continent,
    year,
    population: d3.sum(rows, (r) => r.population),
    generation: d3.sum(rows, (r) => r.generation),
    sources,
    emissions: allEmissions ? d3.sum(rows, (r) => r.emissions) : null,
  });
}

// Coverage = our sum / OWID's continent total for that year. OWID has no continent rows for
// 2025 (except Europe), so the latest earlier OWID total is used as the reference.
function coverageReference(owidByContinent, continent, year) {
  const byYear = owidByContinent.get(continent);
  if (!byYear) return null;
  for (let y = year; y >= year - 1; y--) if (byYear.has(y)) return byYear.get(y).generation;
  return null;
}

export function aggregateContinents(countries, owidContinents) {
  const owidByContinent = d3.index(owidContinents, (r) => r.key, (r) => r.year);
  // Countries of the continent that have data in at least one year.
  const members = d3.rollup(countries, (rows) => new Set(rows.map((r) => r.key)).size, (r) => r.continent);

  const records = [];
  for (const [continent, byYear] of d3.group(countries, (r) => r.continent, (r) => r.year)) {
    for (const [year, rows] of byYear) {
      const record = sumCountries(continent, year, rows);
      const reference = coverageReference(owidByContinent, continent, year);
      record.countriesWithData = rows.length;
      record.countriesTotal = members.get(continent);
      record.coverage = reference ? record.generation / reference : null;
      record.partial = record.coverage !== null && record.coverage < COVERAGE_THRESHOLD;
      records.push(record);
    }
  }
  return records.sort((a, b) => d3.ascending(a.year, b.year) || CONTINENTS.indexOf(a.key) - CONTINENTS.indexOf(b.key));
}

// Checks our sums against OWID's continent rows for the complete period. Returns the
// mismatches (empty when everything agrees within the tolerance).
export function checkAgainstOwid(continents, owidContinents, tolerance = 0.01) {
  const owid = d3.index(owidContinents, (r) => r.key, (r) => r.year);
  const mismatches = [];
  for (const r of continents) {
    if (r.year < COMPLETE_YEARS[0] || r.year > COMPLETE_YEARS[1]) continue;
    const ref = owid.get(r.key)?.get(r.year);
    for (const field of ["generation", "emissions"]) {
      const ours = r[field];
      const theirs = ref?.[field];
      if (ours === null || theirs == null || Math.abs(ours - theirs) > tolerance * Math.abs(theirs)) {
        mismatches.push({ continent: r.key, year: r.year, field, ours, theirs });
      }
    }
  }
  return mismatches;
}
