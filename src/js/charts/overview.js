// "Overview" view — Shneiderman's mantra step 1.
// TODO: replace with the real view 1 chosen in docs/iteration1/02-visualization-choices.md.
export function renderOverview(data, selector) {
  const container = d3.select(selector);
  container.append("p").text(`TODO: overview chart (${data.length} rows loaded).`);
}
