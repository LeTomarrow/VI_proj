// Loads the data files and returns everything the views need. Paths are relative to
// src/index.html (serve the repository root, see README).

import { parseEnergyCsv, preprocess } from "./preprocess.js";
import { aggregateContinents, checkAgainstOwid } from "./aggregate.js";

const ENERGY_URL = "../data/owid-energy-data.csv";
const CONTINENTS_URL = "../data/owid-continents.csv";
const ISO_URL = "../data/iso-numeric.json";

export async function loadEnergyData() {
  const [energyText, continentRows, iso] = await Promise.all([
    d3.text(ENERGY_URL),
    d3.csv(CONTINENTS_URL),
    d3.json(ISO_URL),
  ]);

  const { countries, world, owidContinents } = preprocess(parseEnergyCsv(energyText), continentRows);
  const continents = aggregateContinents(countries, owidContinents);

  const mismatches = checkAgainstOwid(continents, owidContinents);
  console.assert(mismatches.length === 0, "Continent sums differ from OWID's continent rows", mismatches);

  return {
    countries,
    continents,
    world,
    // Map polygon id → country key; polygons without an id are matched by name.
    mapKey: (feature) => iso.byId[feature.id] ?? iso.byName[feature.properties.name] ?? null,
  };
}
