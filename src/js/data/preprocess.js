// Pure preprocessing (no I/O), so it can be tested outside the browser.
// Rules: docs/iteration1/01-data-analysis.md §1.3.

import { YEARS, CONTINENTS, SOURCES, FOSSIL, RENEWABLE, LOW_CARBON, KOSOVO } from "./constants.js";

const COLUMNS = [
  "country", "year", "iso_code", "population", "electricity_generation",
  "greenhouse_gas_emissions", "carbon_intensity_elec", ...Object.values(SOURCES),
];

// The OWID file is space-padded, so headers and values are trimmed. Only the columns the
// app uses are read (16 of 130).
export function parseEnergyCsv(text) {
  const [header, ...rows] = d3.csvParseRows(text);
  const index = Object.fromEntries(header.map((h, i) => [h.trim(), i]));
  for (const c of COLUMNS) if (!(c in index)) throw new Error(`Missing column: ${c}`);
  return rows.map((row) => Object.fromEntries(COLUMNS.map((c) => [c, row[index[c]]?.trim() ?? ""])));
}

const num = (v) => (v === "" || v === undefined ? null : +v);

// Builds one record with the derived values used by every view. Sums of TWh / Mt only, so the
// same function works for countries, continents and the World.
export function deriveRecord({ key, name, continent, year, population, generation, sources, emissions }) {
  const sum = (keys) => d3.sum(keys, (k) => sources[k]);
  const fossil = sum(FOSSIL);
  const renewable = sum(RENEWABLE);
  const lowCarbon = sum(LOW_CARBON);
  const share = (v) => (generation > 0 ? (100 * v) / generation : null);
  return {
    key, name, continent, year, population, generation, sources, emissions,
    fossil, renewable, lowCarbon,
    shares: Object.fromEntries(Object.keys(sources).map((k) => [k, share(sources[k])])),
    fossilShare: share(fossil),
    renewableShare: share(renewable),
    lowCarbonShare: share(lowCarbon),
    // Mt / TWh = 1e12 g / 1e9 kWh → ×1000 for gCO₂/kWh
    carbonIntensity: emissions !== null && generation > 0 ? (1000 * emissions) / generation : null,
    generationPerCapita: population ? (generation * 1e9) / population : null, // kWh/person
    emissionsPerCapita: population && emissions !== null ? (emissions * 1e6) / population : null, // t/person
  };
}

function toRecord(row, key, continent) {
  const generation = num(row.electricity_generation);
  // A source left empty while the total exists counts as 0 (checked for 2000–2024, §1.3).
  const sources = Object.fromEntries(Object.entries(SOURCES).map(([k, col]) => [k, num(row[col]) ?? 0]));
  return deriveRecord({
    key,
    name: row.country,
    continent,
    year: +row.year,
    population: num(row.population),
    generation,
    sources,
    emissions: num(row.greenhouse_gas_emissions),
  });
}

// energyRows: output of parseEnergyCsv; continentRows: owid-continents.csv (entity, code, owid_region).
// Returns country records, the World (reference line) and OWID's own continent rows (used only
// to check our aggregation, see aggregate.js).
export function preprocess(energyRows, continentRows) {
  const continentOf = new Map(continentRows.filter((r) => r.code).map((r) => [r.code, r.owid_region]));
  const countries = [];
  const world = [];
  const owidContinents = [];

  for (const row of energyRows) {
    const year = +row.year;
    if (year < YEARS[0] || year > YEARS[1] || num(row.electricity_generation) === null) continue;

    if (row.country === "World") {
      world.push(toRecord(row, "OWID_WRL", null));
    } else if (CONTINENTS.includes(row.country) && !row.iso_code) {
      owidContinents.push(toRecord(row, row.country, row.country));
    } else {
      const key = row.iso_code || (row.country === "Kosovo" ? KOSOVO : "");
      // Aggregates (empty code or OWID_*) are dropped; Kosovo is the one real country among them.
      if (!key || (key.startsWith("OWID_") && key !== KOSOVO)) continue;
      const continent = continentOf.get(key);
      if (!continent) throw new Error(`No continent for ${row.country} (${key})`);
      countries.push(toRecord(row, key, continent));
    }
  }
  return { countries, world, owidContinents };
}
