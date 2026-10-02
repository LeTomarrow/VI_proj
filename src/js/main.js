import { loadEnergyData } from "./data/loadData.js";
import { renderOverview } from "./charts/overview.js";
import { renderCompare } from "./charts/compare.js";
import { renderDetail } from "./charts/detail.js";

async function init() {
  const data = await loadEnergyData();

  // TODO: shared filter state (year range, region/country, metric) lives here and gets
  // passed down to / updates each view, so interactions in one view can affect the others
  // (linked/coordinated views).

  renderOverview(data, "#chart-overview");
  renderCompare(data, "#chart-compare");
  renderDetail(data, "#chart-detail");
}

init();
