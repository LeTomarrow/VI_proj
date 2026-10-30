import { loadEnergyData } from "./data/loadData.js";
import { renderOverview } from "./charts/overview.js";
import { renderCompare } from "./charts/compare.js";
import { renderDetail } from "./charts/detail.js";

async function init() {
  const data = await loadEnergyData();

  // TODO: shared filter state (year range, region/country, metric) lives here and gets
  // passed down to / updates each view, so interactions in one view can affect the others
  // (linked/coordinated views).

  renderOverview(data.countries, "#chart-overview");
  renderCompare(data.countries, "#chart-compare");
  renderDetail(data.countries, "#chart-detail");
}

init();
