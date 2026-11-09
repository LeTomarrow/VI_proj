// Pop-up opened by clicking an entity in any chart (U7): one click, two explicit actions, so
// drilling down and comparing never depend on a hidden gesture.

import { COUNTRY_LEVEL } from "./data/constants.js";
import { MAX_COMPARED, comparisonType, setState, state, toggleCompared } from "./state.js";
import { hideTooltip } from "./tooltip.js";

const menu = d3.select("body").append("div")
  .attr("class", "entity-menu")
  .attr("role", "dialog")
  .attr("hidden", true);

export function closeEntityMenu() {
  menu.attr("hidden", true);
}

export function openEntityMenu(event, key, name = key) {
  event.stopPropagation();
  hideTooltip();
  menu.selectAll("*").remove();
  menu.attr("hidden", null).attr("aria-label", name);
  menu.append("strong").attr("class", "entity-menu-title").text(name);

  if (state.level === "world") {
    if (COUNTRY_LEVEL.includes(key)) {
      menu.append("button").attr("type", "button").attr("class", "entity-menu-primary")
        .text("Explore countries →")
        .on("click", () => {
          closeEntityMenu();
          setState({ level: "continent", continent: key, hovered: null });
        });
    } else {
      menu.append("p").attr("class", "entity-menu-note")
        .text(`Country view: ${COUNTRY_LEVEL.join(" and ")} only, for now`);
    }
  }

  const compared = state.compared.includes(key);
  const sameType = state.compared.filter((k) => comparisonType(k) === comparisonType(key));
  const full = !compared && sameType.length >= MAX_COMPARED;
  menu.append("button").attr("type", "button")
    .text(compared ? "✓ In comparison · Remove" : "+ Compare")
    .attr("disabled", full ? true : null)
    .on("click", () => { closeEntityMenu(); toggleCompared(key); });
  if (full) menu.append("p").attr("class", "entity-menu-note").text(`The comparison holds ${MAX_COMPARED} at most`);
  if (state.compared.length && !sameType.length) {
    menu.append("p").attr("class", "entity-menu-note")
      .text(`Adding this ${comparisonType(key) === "countries" ? "country" : "continent"} replaces the current comparison.`);
  }

  // Next to the pointer, kept inside the window.
  const { width, height } = menu.node().getBoundingClientRect();
  const x = Math.min(event.clientX + 8, window.innerWidth - width - 8);
  const y = Math.min(event.clientY + 8, window.innerHeight - height - 8);
  menu.style("left", `${x}px`).style("top", `${y}px`);
  menu.select("button").node()?.focus();
}

d3.select(document)
  .on("pointerdown.entity-menu", (event) => {
    if (!menu.node().contains(event.target)) closeEntityMenu();
  })
  .on("keydown.entity-menu", (event) => {
    if (event.key === "Escape") closeEntityMenu();
  });
