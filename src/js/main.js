import { loadEnergyData } from "./data/loadData.js";
import { metricValue } from "./data/metrics.js";
import { CONTINENTS } from "./data/constants.js";
import { METRICS, MODES } from "./scales.js";
import { onStateChange, state } from "./state.js";
import { createControls } from "./controls.js";
import { createMap } from "./charts/map.js";

async function init() {
  const data = await loadEnergyData();

  const byContinent = d3.index(data.continents, (r) => r.key, (r) => r.year);
  const countriesByYear = d3.group(data.countries, (r) => r.year);
  const totalCountries = new Set(data.countries.map((r) => r.key)).size;

  const coverage = ({ year, metric }) => ({
    available: (countriesByYear.get(year) ?? []).filter((r) => r[metric] !== null).length,
    total: totalCountries,
  });

  const controls = createControls("#global-filters", { coverage });
  const map = createMap("#chart-map", data);

  function render(s) {
    const stats = new Map(CONTINENTS.map((key) => [key, metricValue(byContinent.get(key), s)]));
    const period = s.mode === "year" ? s.year : `${s.rangeStart}–${s.year}`;
    const suffix = s.mode === "year" ? "" : ` (${MODES[s.mode].toLowerCase()})`;

    d3.select("#map-title").text(`${METRICS[s.metric].label} by continent, ${period}${suffix}`);
    d3.select("#map-how-to-read").text(`Each continent is the sum of its countries. ${
      s.mode === "change" ? "Blue means cleaner, red means dirtier, pale means little change" : "Darker means a higher value"
    }; hatching means partial coverage.`);

    controls.update(s);
    map.update(stats, s);
  }

  onStateChange(render);
  render(state);
}

init();
