// One-off script: builds data/summary.json, the small data file of the landing and findings
// pages, so they do not load the 70 MB CSV. It reuses the app's own preprocessing and
// continent aggregation (src/js/data/), so the numbers match the app exactly.
//
// Run from the repository root:  npm install && npm run build:summary

import { readFileSync, writeFileSync } from "node:fs";
import * as d3 from "d3";

globalThis.d3 = d3;
const { parseEnergyCsv, preprocess } = await import("../src/js/data/preprocess.js");
const { aggregateContinents } = await import("../src/js/data/aggregate.js");
const { COMPLETE_YEARS, CONTINENTS } = await import("../src/js/data/constants.js");

const OUTPUT = "data/summary.json";
const [first, last] = COMPLETE_YEARS;

const energy = parseEnergyCsv(readFileSync("data/owid-energy-data.csv", "utf8"));
const continentRows = d3.csvParse(readFileSync("data/owid-continents.csv", "utf8"));
const { countries, world, owidContinents } = preprocess(energy, continentRows);
const continents = aggregateContinents(countries, owidContinents);

const round = (v, digits = 1) => (v === null ? null : +v.toFixed(digits));
const pick = (r) => ({
  year: r.year,
  generation: round(r.generation),        // TWh
  lowCarbon: round(r.lowCarbon),          // TWh
  renewableShare: round(r.renewableShare), // %
  emissions: round(r.emissions),          // MtCO₂e
});
const inRange = (r) => r.year >= first && r.year <= last;

const summary = {
  source: "Our World in Data, Energy (Ember, Energy Institute), CC BY 4.0. Built by scripts/build-summary.mjs.",
  years: [first, last],
  countries: new Set(countries.map((r) => r.key)).size,
  world: world.filter(inRange).sort((a, b) => a.year - b.year).map(pick),
  continents: Object.fromEntries(CONTINENTS.map((c) => [c,
    continents.filter((r) => r.key === c && inRange(r)).sort((a, b) => a.year - b.year).map(pick)])),
};
writeFileSync(OUTPUT, `${JSON.stringify(summary)}\n`);
console.log(`${OUTPUT}: ${summary.world.length} world years, ${summary.countries} countries`);
