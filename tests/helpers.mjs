// Shared test setup: the real d3 as a global (as in the browser) and the real data, loaded once
// per test file with the app's own preprocessing and aggregation.

import { readFileSync } from 'node:fs';
import * as d3 from 'd3';

globalThis.d3 = d3;
// motion.js and other browser modules read matchMedia; Node has none.
globalThis.window ??= { matchMedia: () => ({ matches: false }) };

const { deriveRecord, parseEnergyCsv, preprocess } = await import('../src/js/data/preprocess.js');
const { aggregateContinents } = await import('../src/js/data/aggregate.js');

// A record built like the app's: sources in TWh, emissions in MtCO₂e, population.
export function record({ key = 'AAA', name = key, continent = 'Europe', year = 2024, population = 1e6, emissions = 0, ...sources }) {
  const all = { coal: 0, oil: 0, gas: 0, nuclear: 0, hydro: 0, solar: 0, wind: 0, bioenergy: 0, otherRenewable: 0, ...sources };
  const generation = d3.sum(Object.values(all));
  return deriveRecord({ key, name, continent, year, population, generation, sources: all, emissions });
}

// Map key → Map year → record, as main.js builds it.
export const indexByKey = (records) => d3.index(records, (r) => r.key, (r) => r.year);

let cache = null;
export function realData() {
  if (cache) return cache;
  const energy = parseEnergyCsv(readFileSync('data/owid-energy-data.csv', 'utf8'));
  const continentRows = d3.csvParse(readFileSync('data/owid-continents.csv', 'utf8'));
  const { countries, world, owidContinents } = preprocess(energy, continentRows);
  const continents = aggregateContinents(countries, owidContinents);
  cache = {
    countries, world, owidContinents, continents,
    byCountry: indexByKey(countries),
    byContinent: indexByKey(continents),
    byWorld: d3.index(world, (r) => r.year),
    countriesOf: d3.rollup(countries, (rows) => [...new Set(rows.map((r) => r.key))], (r) => r.continent),
  };
  return cache;
}
