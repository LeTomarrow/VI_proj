import { loadEnergyData } from "./data/loadData.js";
import { metricValue } from "./data/metrics.js";
import { CONTINENTS } from "./data/constants.js";
import { METRICS, MODES, metricColor } from "./scales.js";
import { onStateChange, state } from "./state.js";
import { createControls } from "./controls.js";
import { createMap } from "./charts/map.js";
import { createMarimekko } from "./charts/marimekko.js";

async function init() {
  const data = await loadEnergyData();

  const byContinent = d3.index(data.continents, (r) => r.key, (r) => r.year);
  const countriesByYear = d3.group(data.countries, (r) => r.year);
  const totalCountries = new Set(data.countries.map((r) => r.key)).size;
  const maxTotal = d3.max(d3.rollup(data.continents, (rows) => d3.sum(rows, (r) => r.generation), (r) => r.year).values());

  const coverage = ({ year, metric }) => ({
    available: (countriesByYear.get(year) ?? []).filter((r) => r[metric] !== null).length,
    total: totalCountries,
  });

  const controls = createControls("#global-filters", { coverage });
  const map = createMap("#chart-map", data);
  const marimekko = createMarimekko("#chart-marimekko", { maxTotal });

  function render(s) {
    const stats = new Map(CONTINENTS.map((key) => [key, metricValue(byContinent.get(key), s)]));
    const records = data.continents.filter((r) => r.year === s.year);
    const period = s.mode === "year" ? s.year : `${s.rangeStart}–${s.year}`;
    const suffix = s.mode === "year" ? "" : ` (${MODES[s.mode].toLowerCase()})`;

    d3.select("#map-title").text(`${METRICS[s.metric].label} by continent, ${period}${suffix}`);
    d3.select("#map-how-to-read").text(`Each continent is the sum of its countries. ${
      s.mode === "change" ? "Blue means cleaner, red means dirtier, pale means little change" : "Darker means a higher value"
    }; hatching means partial coverage.`);
    d3.select("#marimekko-title").text(`Electricity generation by source and continent, ${s.year}`);

    controls.update(s);
    map.update(stats, s);
    marimekko.update(records, stats, s, metricColor(s.metric, s.mode));
  }

  onStateChange(render);
  render(state);
}

init();
