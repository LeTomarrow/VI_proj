import { loadEnergyData } from "./data/loadData.js";
import { metricValue } from "./data/metrics.js";
import { CONTINENTS } from "./data/constants.js";
import { METRICS, MODES, metricColor } from "./scales.js";
import { onStateChange, state } from "./state.js";
import { createControls } from "./controls.js";
import { createNavigation } from "./navigation.js";
import { createComparisonTabs } from "./comparisonTabs.js";
import { createCountryProfiles } from "./charts/countryProfiles.js";
import { createMap } from "./charts/map.js";
import { createMarimekko } from "./charts/marimekko.js";
import { comparedContinents, createEmissionsArea } from "./charts/emissionsArea.js";

async function init() {
  createComparisonTabs("#panel-continent");
  const data = await loadEnergyData();

  const byContinent = d3.index(data.continents, (r) => r.key, (r) => r.year);
  const byCountry = d3.index(data.countries, (r) => r.key, (r) => r.year);
  const countriesOf = d3.rollup(data.countries, (rows) => [...new Set(rows.map((r) => r.key))], (r) => r.continent);
  const nameOf = new Map(data.countries.map((r) => [r.key, r.name]));
  const countriesByYear = d3.group(data.countries, (r) => r.year);
  const totalCountries = new Set(data.countries.map((r) => r.key)).size;
  const maxTotal = d3.max(d3.rollup(data.continents, (rows) => d3.sum(rows, (r) => r.generation), (r) => r.year).values());

  const coverage = ({ year, metric }) => ({
    available: (countriesByYear.get(year) ?? []).filter((r) => r[metric] !== null).length,
    total: totalCountries,
  });

  const controls = createControls("#global-filters", { coverage });
  const navigation = createNavigation("#navigation", { nameOf });
  const map = createMap("#chart-map", { ...data, nameOf });
  const marimekko = createMarimekko("#chart-marimekko", { maxTotal });
  const emissions = createEmissionsArea("#chart-emissions", data);
  const profiles = createCountryProfiles("#chart-profiles", data);

  function render(s) {
    const stats = new Map(CONTINENTS.map((key) => [key, metricValue(byContinent.get(key), s)]));
    const atCountries = s.level === "continent";
    const mapStats = atCountries
      ? new Map((countriesOf.get(s.continent) ?? []).map((key) => [key, metricValue(byCountry.get(key), s)]))
      : stats;
    const records = data.continents.filter((r) => r.year === s.year);
    const period = s.mode === "year" ? s.year : `${s.rangeStart}–${s.year}`;
    const suffix = s.mode === "year" ? "" : ` (${MODES[s.mode].toLowerCase()})`;

    const { label, darker, cleanerIs } = METRICS[s.metric];
    d3.select("#map-title").text(atCountries
      ? `${label} by country, ${s.continent}, ${period}${suffix}`
      : `${label}, ${period}${suffix}`);
    const [cleaner, dirtier] = cleanerIs > 0 ? ["rose", "fell"] : ["fell", "rose"];
    const colourLine = s.mode === "change"
      ? `Blue = ${label.toLowerCase()} ${cleaner} (cleaner), red = it ${dirtier}.`
      : `Darker = ${darker}.`;
    d3.select("#map-how-to-read").text(atCountries
      ? `${colourLine}${s.continent === "Europe" ? " Russia counts as Europe." : ""}`
      : `${colourLine} Hatched = data for under 80% of the continent's electricity.`);
    d3.select("#marimekko-title").text(`Electricity mix, ${s.year}`);
    const compared = comparedContinents(s);
    d3.select("#emissions-title").text(`CO₂ from electricity, 2000–2024${compared.length ? `: ${compared.join(" vs ")}` : ""}`);
    d3.select("#emissions-how-to-read").text(compared.length
      ? "Compared continents only, each from zero. Remove them from the comparison to see the world stack."
      : "Stacked by continent; the top edge is the world total.");

    controls.update(s);
    navigation.update(s);
    // The map and the Marimekko stay; only the third panel changes with the level.
    d3.select("#panel-emissions").attr("hidden", atCountries ? true : null);
    d3.select("#panel-continent").attr("hidden", atCountries ? null : true);
    d3.select("#continent-title").text(s.continent ? `Compare · ${s.continent}` : "Compare");

    map.update(mapStats, s);
    marimekko.update(records, stats, s, metricColor(s.metric, s.mode));
    emissions.update(s);
    profiles.update(s);
  }

  onStateChange(render);
  render(state);
}

init();
