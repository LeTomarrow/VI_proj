import { loadEnergyData } from "./data/loadData.js";
import { metricValue } from "./data/metrics.js";
import { comparedColumns, rankedColumns, rankMax } from "./data/countryColumns.js";
import { CONTINENTS } from "./data/constants.js";
import { METRICS, MODES, RANKS } from "./scales.js";
import { closeCompare, comparedContinents, comparisonType, onStateChange, setContinentLookup, state } from "./state.js";
import { motionKey } from "./motion.js";
import { createControls } from "./controls.js";
import { createNavigation } from "./navigation.js";
import { brushedKeys } from "./data/scatter.js";
import { createBubbleScatter } from "./charts/bubbleScatter.js";
import { createChangeBars } from "./charts/changeBars.js";
import { createCompareRows } from "./charts/compareRows.js";
import { createCountryProfiles } from "./charts/countryProfiles.js";
import { createMap } from "./charts/map.js";
import { createMarimekko } from "./charts/marimekko.js";
import { createEmissionsArea } from "./charts/emissionsArea.js";

async function init() {
  const data = await loadEnergyData();

  const byContinent = d3.index(data.continents, (r) => r.key, (r) => r.year);
  const byCountry = d3.index(data.countries, (r) => r.key, (r) => r.year);
  const countriesOf = d3.rollup(data.countries, (rows) => [...new Set(rows.map((r) => r.key))], (r) => r.continent);
  const nameOf = new Map(data.countries.map((r) => [r.key, r.name]));
  const continentOf = new Map(data.countries.map((r) => [r.key, r.continent]));
  setContinentLookup((key) => continentOf.get(key));
  const countriesByYear = d3.group(data.countries, (r) => r.year);
  const totalCountries = new Set(data.countries.map((r) => r.key)).size;
  const maxTotal = d3.max(d3.rollup(data.continents, (rows) => d3.sum(rows, (r) => r.generation), (r) => r.year).values());
  // Scale of the ranked bars: the largest value of the continent's countries in any year.
  const rankMaxCache = new Map();
  const rankMaxOf = (continent, rank) => {
    const key = `${continent}|${rank.key}`;
    if (!rankMaxCache.has(key)) rankMaxCache.set(key, rankMax(byCountry, countriesOf.get(continent) ?? [], rank));
    return rankMaxCache.get(key);
  };

  const coverage = ({ year, metric }) => ({
    available: (countriesByYear.get(year) ?? []).filter((r) => r[metric] !== null).length,
    total: totalCountries,
  });

  const controls = createControls("#global-filters", { coverage, metricSelector: "#map-metric" });
  const navigation = createNavigation("#navigation", { nameOf, compareSelector: "#global-filters" });
  const map = createMap("#chart-map", { ...data, nameOf });
  const marimekko = createMarimekko("#chart-marimekko");
  const emissions = createEmissionsArea("#chart-emissions", data);
  const scatter = createBubbleScatter("#chart-scatter", { ...data, countriesOf });
  const bars = createChangeBars("#chart-bars", { ...data, countriesOf });
  const profiles = createCountryProfiles("#chart-profiles", data);
  // A year read in View C's rows (hover or pin) redraws the radars for that year.
  const compareRows = createCompareRows("#chart-compare-rows", { ...data, onPreview: (s) => profiles.update(s) });
  d3.select("#close-compare").on("click", () => closeCompare());

  // View C replaces the other panels; they are updated again when it closes.
  function renderCompare(s) {
    controls.update(s);
    navigation.update(s);
    d3.selectAll(".panel-map, .panel-marimekko, #panel-emissions, #panel-continent").attr("hidden", true);
    d3.select("#panel-compare").attr("hidden", null);
    d3.select(".views").classed("is-continent", false).classed("is-compare", true);
    const names = s.compared.map((k) => nameOf.get(k) ?? k);
    d3.select("#compare-title").text(names.length ? `Compare: ${names.join(", ")}` : "Compare");
    d3.select("#close-compare").text(`← Back to ${s.compareFrom === "continent" ? s.continent : "World"}`);
    profiles.update(s);
    compareRows.update(s);
  }

  // Marks move only when the data shown changes, not on hover (motion.js).
  let lastMotion = null;

  function render(current) {
    if (current.level === "compare") return renderCompare(current);
    d3.select("#panel-compare").attr("hidden", true);
    d3.selectAll(".panel-map, .panel-marimekko").attr("hidden", null);
    d3.select(".views").classed("is-compare", false);
    // The scatter brush, as the keys inside it, for every chart of View B.
    const s = { ...current, brushed: brushedKeys(countriesOf.get(current.continent) ?? [], byCountry, current) };
    const key = motionKey(s);
    s.animate = lastMotion !== null && key !== lastMotion;
    lastMotion = key;
    const stats = new Map(CONTINENTS.map((key) => [key, metricValue(byContinent.get(key), s)]));
    const atCountries = s.level === "continent";
    const mapStats = atCountries
      ? new Map((countriesOf.get(s.continent) ?? []).map((key) => [key, metricValue(byCountry.get(key), s)]))
      : stats;
    const rank = RANKS.find((r) => r.key === s.mekkoRank) ?? RANKS[0];
    const keys = countriesOf.get(s.continent) ?? [];
    // Country level, as bars + mix: two or more compared countries show only them; otherwise the
    // ranked top N (Top 5 / Top 10).
    const comparedCountries = s.compared.filter((k) => comparisonType(k) === "countries");
    const onlyCompared = atCountries && s.mekkoCompared && comparedCountries.length >= 2;
    const continentRecord = byContinent.get(s.continent)?.get(s.year) ?? null;
    const ranking = onlyCompared ? {
      view: "compared",
      columns: comparedColumns({ byCountry, countriesOf, compared: comparedCountries, rank }, s),
      max: rankMax(byCountry, comparedCountries, rank),
      continentRecord,
    } : atCountries ? {
      view: "top",
      columns: rankedColumns({ byCountry, keys, compared: s.compared, rank }, s, s.mekkoTop ?? 10),
      max: rankMaxOf(s.continent, rank),
      continentRecord,
    } : null;
    const period = s.mode === "year" ? s.year : `${s.rangeStart}-${s.year}`;
    const suffix = s.mode === "year" ? "" : ` (${MODES[s.mode].toLowerCase()})`;

    const { label, darker, cleanerIs } = METRICS[s.metric];
    d3.select("#map-title").text(atCountries
      ? `${label} by country, ${s.continent}, ${period}${suffix}`
      : `${label}, ${period}${suffix}`);
    const [cleaner, dirtier] = cleanerIs > 0 ? ["rose", "fell"] : ["fell", "rose"];
    const colourLine = s.mode === "change"
      ? (cleanerIs ? `Blue = ${label.toLowerCase()} ${cleaner} (cleaner), red = it ${dirtier}.`
        : `Purple = more ${label.toLowerCase()}, orange = less.`)
      : `Darker = ${darker}.`;
    d3.select("#map-how-to-read").text(atCountries
      ? `${colourLine}${s.continent === "Europe" ? " Russia counts as Europe." : ""}`
      : `${colourLine} Hatched = data for under 80% of the continent's electricity.`);
    // One short reading line; the tooltips give the details.
    const atBase = rank.groups.length ? `, ${rank.name.replace(/ generation$/, "")} at the base` : "";
    d3.select("#marimekko-title").text(!atCountries ? `Electricity mix by continent, ranked by ${rank.name}, ${s.year}`
      : onlyCompared ? `Compared countries by ${rank.name}, ${s.year}`
        : `Top ${s.mekkoTop ?? 10} by ${rank.name}, ${s.continent}, ${s.year}`);
    const dashed = rank.groups.length && ranking?.columns.records.every((r) => r.continent === s.continent)
      ? ` (dashed = ${s.continent})` : "";
    const extraNote = ranking?.columns.extra.length ? " Compared countries outside it on the right." : "";
    d3.select("#marimekko-how-to-read").text(!atCountries
      ? `Width = total generation, height = share of each source${atBase}.`
      : `Bars = TWh; columns = share of each source${atBase}${dashed}.${onlyCompared ? "" : extraNote}`);
    const compared = comparedContinents(s);
    d3.select("#emissions-title").text(`CO₂e from electricity, 2000-2024${compared.length ? `: ${compared.join(" vs ")}` : ""}`);
    d3.select("#emissions-how-to-read").text(compared.length
      ? "Compared continents only, each from zero. Remove them from the comparison to see the world stack."
      : "Stacked by continent; the top edge is the world total.");

    controls.update(s);
    navigation.update(s);
    // The map and the Marimekko stay; only the third panel changes with the level.
    d3.select("#panel-emissions").attr("hidden", atCountries ? true : null);
    d3.select("#panel-continent").attr("hidden", atCountries ? null : true);
    d3.select("#continent-title").text(s.continent ? `${s.continent}: countries` : "");
    // The bottom row gets more room at the country level: the scatter needs height.
    d3.select(".views").classed("is-continent", atCountries);
    d3.select("#scatter-title").text(`Emissions from electricity by country, ${s.continent}, ${s.year}`);
    d3.select("#scatter-how-to-read").text("x = emissions per person, y = CO₂e per kWh, area = total emissions. "
      + (s.mode === "year" ? "Compared countries are outlined." : `Hover a compared country to see its path since ${s.rangeStart}.`)
      + (s.brushed ? ` ${s.brushed.size} countries selected (dashed on the map); ${comparedCountries.length ? "click outside the box to clear the selection." : "+ Compare adds them; click outside the box or Clear all to clear."}`
        : comparedCountries.length ? " Drag to select among the compared countries." : " Drag to select a group in every chart."));
    d3.select("#bars-title").text(`Change by country, ${s.continent}, ${s.rangeStart}-${s.year}`);
    d3.select("#bars-how-to-read").text(`Sorted from the ${s.barsSort === "asc" ? "smallest" : "largest"} renewable gain; dashed line = World. CO₂e: ▼ fell, ▲ rose.`);

    map.update(mapStats, s);
    marimekko.update(s, atCountries
      ? { rank, ranking }
      : { records: data.continents.filter((r) => r.year === s.year), stats, maxTotal, rank });
    emissions.update(s);
    scatter.update(s);
    bars.update(s);
    // Later redraws of this state (resize) are instant.
    s.animate = false;
  }

  onStateChange(render);
  render(state);
}

init();
