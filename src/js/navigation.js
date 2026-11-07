// Breadcrumb (World → Continent) and the comparison list, shown on every level.

import { CONTINENT_COLORS } from "./scales.js";
import { MAX_COMPARED, setState, toggleCompared } from "./state.js";

export function createNavigation(selector) {
  const root = d3.select(selector);
  const crumbs = root.append("ol").attr("class", "breadcrumb");

  const compare = root.append("div").attr("class", "compare-list").attr("aria-label", "Comparison list");
  compare.append("span").attr("class", "control-label").text(`Compare (up to ${MAX_COMPARED})`);
  const chips = compare.append("ul").attr("class", "chips");
  const hint = compare.append("span").attr("class", "compare-hint")
    .text("Click a continent, then + Compare");

  return {
    update(s) {
      const steps = [{ label: "World", patch: { level: "world", continent: null } }];
      if (s.level === "continent") steps.push({ label: s.continent });
      crumbs.selectAll("li").data(steps).join("li").each(function (step, i) {
        const li = d3.select(this);
        li.selectAll("*").remove();
        if (i < steps.length - 1) {
          li.append("button").attr("type", "button").attr("class", "link")
            .text(step.label)
            .on("click", () => setState({ ...step.patch, hovered: null }));
        } else {
          li.append("span").attr("aria-current", "page").text(step.label);
        }
      });

      hint.attr("hidden", s.compared.length ? true : null);
      const items = chips.selectAll("li").data(s.compared, (k) => k).join((enter) => {
        const li = enter.append("li").attr("class", "chip");
        li.append("span").attr("class", "swatch").style("background", (k) => CONTINENT_COLORS[k] ?? "#6f6d68");
        li.append("span").text((k) => k);
        li.append("button").attr("type", "button").attr("class", "chip-remove")
          .attr("aria-label", (k) => `Remove ${k} from the comparison`)
          .text("×")
          .on("click", (_, k) => { toggleCompared(k); setState({ hovered: null }); });
        return li;
      });
      items
        .classed("is-hovered", (k) => k === s.hovered)
        .on("mouseenter", (_, k) => setState({ hovered: k }))
        .on("mouseleave", () => setState({ hovered: null }));
    },
  };
}
