// One-off script: builds data/iso-numeric.json, which joins the map polygons to the OWID data.
//
// world-atlas identifies countries by numeric ISO 3166 code ("716"); OWID uses the
// three-letter code ("ZWE"). This script converts every map id with i18n-iso-countries and
// reports what does not match, so the join is validated before the app relies on it.
//
// Run from the repository root:  npm install && npm run build:iso

import { readFileSync, writeFileSync } from "node:fs";
import countries from "i18n-iso-countries";

const ATLAS_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json";
const ENERGY_CSV = "data/owid-energy-data.csv";
const OUTPUT = "data/iso-numeric.json";

// Polygons without a numeric id that do have OWID data, keyed by the atlas name.
const BY_NAME = { Kosovo: "OWID_KOS" };

const atlas = await (await fetch(ATLAS_URL)).json();
const geometries = atlas.objects.countries.geometries;

const byId = {};
const unconverted = [];
const withoutId = [];
for (const g of geometries) {
  if (g.id === undefined) {
    if (!(g.properties.name in BY_NAME)) withoutId.push(g.properties.name);
    continue;
  }
  const alpha3 = countries.numericToAlpha3(g.id);
  if (alpha3) byId[g.id] = alpha3;
  else unconverted.push(`${g.id} ${g.properties.name}`);
}

// OWID countries with electricity data (aggregates excluded) that have no polygon.
const [header, ...lines] = readFileSync(ENERGY_CSV, "utf8").split("\n");
const cols = header.split(",").map((c) => c.trim());
const iCountry = cols.indexOf("country");
const iIso = cols.indexOf("iso_code");
const iGen = cols.indexOf("electricity_generation");
const owid = new Map();
for (const line of lines) {
  const f = line.split(",");
  const iso = (f[iIso] ?? "").trim();
  if (iso && !iso.startsWith("OWID") && (f[iGen] ?? "").trim()) owid.set(iso, f[iCountry].trim());
}
const drawn = new Set([...Object.values(byId), ...Object.values(BY_NAME)]);
const noPolygon = [...owid].filter(([iso]) => !drawn.has(iso)).map(([iso, name]) => `${iso} ${name}`);

writeFileSync(OUTPUT, JSON.stringify({ byId, byName: BY_NAME }, null, 1) + "\n");

console.log(`${OUTPUT}: ${Object.keys(byId).length} ids converted, ${Object.keys(BY_NAME).length} by name`);
console.log("Map ids not converted:", unconverted.length ? unconverted : "none");
console.log("Polygons without id or data (drawn grey):", withoutId);
console.log("OWID countries without own polygon (counted in totals only):", noPolygon);
