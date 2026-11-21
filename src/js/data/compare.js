// Pure helpers of View C (no DOM), so they can be tested in Node.

import { SOURCE_GROUPS } from "../scales.js";
import { comparisonType } from "../state.js";

// Share of each source group in one record (radar axes). Null without generation.
export function sourceProfile(record) {
  if (!record || !(record.generation > 0)) return null;
  return SOURCE_GROUPS.map((group) => {
    const generation = d3.sum(group.parts, (key) => record.sources[key]);
    return { ...group, generation, share: (100 * generation) / record.generation };
  });
}

// Radar reference: "none", "world" or the continent of the compared countries (they share one,
// since the comparison belongs to a level). Continents can only use the World.
export function referenceFor(compared, profileRef, continentOf) {
  const countries = compared.length > 0 && comparisonType(compared[0]) === "countries";
  const continent = countries ? continentOf(compared[0]) ?? null : null;
  const options = [["none", "None"], ["world", "World"], ...(continent ? [["continent", continent]] : [])];
  const pick = options.some(([k]) => k === profileRef) ? profileRef : "world";
  return { options, pick, continent };
}

// Columns of the View C rows. Continents skip the mix (View A's Marimekko shows it).
export const COMPARE_COLUMNS = ["mix", "race", "effects"];
export function compareColumnKeys(compared) {
  const continents = compared.length > 0 && comparisonType(compared[0]) === "continents";
  return continents ? COMPARE_COLUMNS.filter((k) => k !== "mix") : COMPARE_COLUMNS;
}
