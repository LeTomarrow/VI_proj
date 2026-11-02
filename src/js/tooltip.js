// One tooltip shared by all the charts. Values must be quotable: value, unit and year.

const tooltip = d3.select("body").append("div").attr("class", "tooltip").attr("hidden", true);

export function showTooltip(event, html) {
  tooltip.attr("hidden", null).html(html);
  const { width, height } = tooltip.node().getBoundingClientRect();
  const x = event.clientX + 14 + width > window.innerWidth ? event.clientX - width - 14 : event.clientX + 14;
  const y = Math.min(event.clientY + 14, window.innerHeight - height - 8);
  tooltip.style("left", `${x}px`).style("top", `${y}px`);
}

export function hideTooltip() {
  tooltip.attr("hidden", true);
}

// Coverage line for a continent: says what the value sums and flags partial years.
export function coverageLine({ partial, record }, mode) {
  if (!partial) return "";
  if (mode !== "year") return `<div class="tooltip-note">Includes years with partial coverage</div>`;
  return `<div class="tooltip-note">Sum of ${record.countriesWithData}/${record.countriesTotal} countries with data</div>`;
}
