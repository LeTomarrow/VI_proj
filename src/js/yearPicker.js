// A grid of years that opens under a year in the slider's label (user test: picking an exact year
// by dragging is slow). One row per decade; partial-coverage years are greyed like the slider
// track; years outside the allowed range are disabled. Arrows move by a year (← →) or a decade
// (↑ ↓), Enter picks, Esc or a click outside closes.

import { COMPLETE_YEARS, YEARS } from "./data/constants.js";

const ALL = d3.range(YEARS[0], YEARS[1] + 1);
const FIRST_DECADE = Math.floor(YEARS[0] / 10) * 10;

export function createYearPicker(container) {
  const panel = container.append("div").attr("class", "year-picker").attr("role", "dialog")
    .attr("aria-label", "Choose a year").attr("hidden", true);
  let trigger = null;

  function close(refocus = true) {
    if (panel.attr("hidden") !== null) return;
    panel.attr("hidden", true);
    if (refocus) trigger?.focus();
    trigger?.setAttribute("aria-expanded", "false");
    trigger = null;
  }

  // anchor: the button clicked; options: { value, min, max, range: [from, to], onPick }.
  function open(anchor, { value, min, max, range, onPick }) {
    if (trigger === anchor) return close();
    close(false);
    trigger = anchor;
    anchor.setAttribute("aria-expanded", "true");
    const allowed = (y) => y >= min && y <= max;
    const pick = (y) => { close(); onPick(y); };

    const cells = d3.range(FIRST_DECADE, YEARS[1] + 1).map((y) => (y < YEARS[0] ? null : y));
    panel.selectAll("*").remove();
    panel.append("div").attr("class", "year-grid").selectAll("span, button").data(cells).join((enter) => enter.append((y) => document.createElement(y === null ? "span" : "button")))
      .each(function (y) {
        if (y === null) return;
        d3.select(this)
          .attr("type", "button")
          .attr("class", "year-cell")
          .classed("is-partial", y < COMPLETE_YEARS[0] || y > COMPLETE_YEARS[1])
          .classed("is-in-range", !!range && y > range[0] && y < range[1])
          .attr("aria-pressed", String(y === value))
          .attr("aria-label", `${y}${y < COMPLETE_YEARS[0] || y > COMPLETE_YEARS[1] ? ", partial coverage" : ""}`)
          .attr("title", y < COMPLETE_YEARS[0] || y > COMPLETE_YEARS[1] ? "Partial coverage" : null)
          .attr("tabindex", y === value ? 0 : -1)
          .property("disabled", !allowed(y))
          // Decade starts in full, the rest as two digits, so the grid stays narrow.
          .text(y % 10 === 0 || y === YEARS[0] ? y : String(y).slice(2))
          .on("click", () => pick(y))
          .on("keydown", (event) => {
            const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -10, ArrowDown: 10 }[event.key];
            if (event.key === "Escape") { event.preventDefault(); close(); return; }
            if (!step) return;
            event.preventDefault();
            let next = y + step;
            while (ALL.includes(next) && !allowed(next)) next += Math.sign(step);
            if (ALL.includes(next)) panel.select(`.year-cell[aria-label^="${next}"]`).node()?.focus();
          });
      });
    panel.append("p").attr("class", "year-picker-note").text(`Grey = partial coverage (outside ${COMPLETE_YEARS[0]}-${COMPLETE_YEARS[1]})`);

    // Under the clicked year, inside the control.
    const box = container.node().getBoundingClientRect();
    const at = anchor.getBoundingClientRect();
    panel.style("left", `${at.left - box.left}px`).style("top", `${at.bottom - box.top + 6}px`).attr("hidden", null);
    (panel.select(".year-cell[aria-pressed='true']:not(:disabled)").node()
      ?? panel.select(".year-cell:not(:disabled)").node())?.focus();
  }

  document.addEventListener("pointerdown", (event) => {
    if (trigger && !panel.node().contains(event.target) && event.target !== trigger) close(false);
  });

  return { open, close };
}
