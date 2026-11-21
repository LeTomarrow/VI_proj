// Breadcrumb (World → Continent → Compare) and the comparison list of the current level. The list
// sits in the sticky filter bar (compareSelector), so it stays in reach while scrolling.

import { CONTINENT_COLORS, COUNTRY_COMPARE_COLORS } from "./scales.js";
import { MAX_COMPARED, comparedSlot, comparisonType, goToLevel, openCompare, setState, toggleCompared } from "./state.js";

export function createNavigation(selector, { nameOf, compareSelector = selector }) {
  const root = d3.select(selector);
  const crumbs = root.append("ol").attr("class", "breadcrumb");

  const compare = d3.select(compareSelector).append("div").attr("class", "compare-list").attr("aria-label", "Comparison list");
  const label = compare.append("span").attr("class", "control-label");
  const chips = compare.append("ul").attr("class", "chips");
  // Empties the list and the scatter brush in one click (shown with two or more entries, or with
  // a brush; one entry has its own ×).
  const clear = compare.append("button").attr("type", "button").attr("class", "link compare-clear")
    .text("Clear all")
    .attr("aria-label", "Remove every entry from the comparison and clear the scatter selection")
    .on("click", () => setState({ compared: [], brush: null, hovered: null }));
  // View C: the list stays as it is.
  const open = compare.append("button").attr("type", "button").attr("class", "compare-open")
    .text("Compare →")
    .on("click", () => openCompare());
  const hint = compare.append("span").attr("class", "compare-hint");

  return {
    update(s) {
      const type = s.compared.length ? comparisonType(s.compared[0]) : null;
      label.text(type ? `Comparing ${type} (${s.compared.length}/${MAX_COMPARED})` : `Compare (up to ${MAX_COMPARED})`);
      compare.attr("aria-label", type ? `Comparing ${type}` : "Comparison list");
      const steps = [{ label: "World", patch: { level: "world", continent: null } }];
      const inCompare = s.level === "compare";
      if (s.level === "continent" || (inCompare && s.compareFrom === "continent")) {
        steps.push({ label: s.continent, patch: { level: "continent" } });
      }
      if (inCompare) steps.push({ label: "Compare" });
      crumbs.selectAll("li").data(steps).join("li").each(function (step, i) {
        const li = d3.select(this);
        li.selectAll("*").remove();
        if (i < steps.length - 1) {
          li.append("button").attr("type", "button").attr("class", "link")
            .text(step.label)
            .on("click", () => goToLevel(step.patch));
        } else {
          li.append("span").attr("aria-current", "page").text(step.label);
        }
      });

      hint.attr("hidden", s.compared.length ? true : null)
        .text(s.level === "world" ? "Click a continent, then + Compare" : "Click a country, then + Compare");
      open.attr("hidden", s.compared.length && !inCompare ? null : true)
        .attr("title", `Open the comparison: one row per ${type === "continents" ? "continent" : "country"}`);
      const brushShown = s.level === "continent" && s.brush?.continent === s.continent;
      clear.attr("hidden", s.compared.length >= 2 || brushShown ? null : true);
      const items = chips.selectAll("li").data(s.compared, (k) => k).join((enter) => {
        const li = enter.append("li").attr("class", "chip");
        li.append("span").attr("class", "swatch");
        li.append("span").text((k) => nameOf.get(k) ?? k);
        li.append("button").attr("type", "button").attr("class", "chip-remove")
          .attr("aria-label", (k) => `Remove ${nameOf.get(k) ?? k} from the comparison`)
          .text("×")
          .on("click", (_, k) => { toggleCompared(k); setState({ hovered: null }); });
        return li;
      });
      items
        .classed("is-hovered", (k) => k === s.hovered)
        .on("mouseenter", (_, k) => setState({ hovered: k }))
        .on("mouseleave", () => setState({ hovered: null }));
      items.select(".swatch").style("background", (k) => CONTINENT_COLORS[k] ?? COUNTRY_COMPARE_COLORS[comparedSlot(k)]);
    },
  };
}
