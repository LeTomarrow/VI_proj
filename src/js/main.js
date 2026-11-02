import { loadEnergyData } from "./data/loadData.js";
import { onStateChange, state } from "./state.js";
import { createControls } from "./controls.js";

async function init() {
  const data = await loadEnergyData();

  const countriesByYear = d3.group(data.countries, (r) => r.year);
  const totalCountries = new Set(data.countries.map((r) => r.key)).size;

  const coverage = ({ year, metric }) => ({
    available: (countriesByYear.get(year) ?? []).filter((r) => r[metric] !== null).length,
    total: totalCountries,
  });

  const controls = createControls("#global-filters", { coverage });

  onStateChange(controls.update);
  controls.update(state);
}

init();
