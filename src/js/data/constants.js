// Shared definitions for the data layer. Rules and their justification are in
// docs/iteration1/01-data-analysis.md (§1.2–1.4).

export const YEARS = [1985, 2025];          // slider range
export const COMPLETE_YEARS = [2000, 2024]; // emissions available, near-complete coverage
export const COVERAGE_THRESHOLD = 0.8;      // continent-years below this are "partial"

export const CONTINENTS = ["Africa", "Asia", "Europe", "North America", "South America", "Oceania"];

// Electricity sources: key used in the app → OWID column (TWh).
// other_renewable_exc_biofuel_electricity avoids counting bioenergy twice (§1.2).
export const SOURCES = {
  coal: "coal_electricity",
  oil: "oil_electricity",
  gas: "gas_electricity",
  nuclear: "nuclear_electricity",
  hydro: "hydro_electricity",
  solar: "solar_electricity",
  wind: "wind_electricity",
  bioenergy: "biofuel_electricity",
  otherRenewable: "other_renewable_exc_biofuel_electricity",
};

export const FOSSIL = ["coal", "oil", "gas"];
export const RENEWABLE = ["hydro", "solar", "wind", "bioenergy", "otherRenewable"];
export const LOW_CARBON = ["nuclear", ...RENEWABLE];

// Kosovo has no ISO code in the energy data; OWID's continent mapping uses OWID_KOS.
export const KOSOVO = "OWID_KOS";
