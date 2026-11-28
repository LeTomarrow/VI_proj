// Shared controls: mode, year slider (second handle in the range modes), play, coverage. The
// metric is the map's own control, so it sits in the map card (metricSelector).

import { COMPLETE_YEARS, YEARS } from "./data/constants.js";
import { METRICS, MODES } from "./scales.js";
import { setState } from "./state.js";
import { createYearPicker } from "./yearPicker.js";

const pct = (year) => (100 * (year - YEARS[0])) / (YEARS[1] - YEARS[0]);
const PLAY_STEP = 1000; // ms per year

export function createControls(selector, { coverage, metricSelector }) {
  const root = d3.select(selector);

  const metric = d3.select(metricSelector).append("label").attr("class", "map-metric");
  metric.append("span").attr("class", "control-label").text("Colour by");
  const metricSelect = metric.append("select").on("change", (event) => setState({ metric: event.target.value }));
  metricSelect.selectAll("option").data(Object.entries(METRICS)).join("option")
    .attr("value", ([key]) => key)
    .text(([, m]) => m.label);

  const years = root.append("div").attr("class", "control control-years");
  const yearsHead = years.append("div").attr("class", "control-head");
  // Year / Change sits with the slider: Change adds the start handle, which sets the period of the
  // map colours and of the change bars (user test, T3).
  const mode = yearsHead.append("div").attr("class", "segmented segmented-compact").attr("role", "group")
    .attr("aria-label", "One year or the change over a period");
  const modeButtons = mode.selectAll("button").data(Object.entries(MODES)).join("button")
    .attr("type", "button")
    .text(([, label]) => label)
    .attr("title", ([key]) => (key === "year" ? "One year" : "Change over a period: drag the start handle"))
    .on("click", (_, [key]) => { stop(); setState({ mode: key }); });
  const picker = createYearPicker(years);
  const playButton = yearsHead.append("button").attr("type", "button").attr("class", "play")
    .on("click", () => (timer ? stop() : play()));
  const slider = years.append("div").attr("class", "slider");
  const track = slider.append("div").attr("class", "slider-track");
  track.style("background", `linear-gradient(to right,
    var(--color-partial) ${pct(COMPLETE_YEARS[0] - 0.5)}%, var(--color-complete) ${pct(COMPLETE_YEARS[0] - 0.5)}%,
    var(--color-complete) ${pct(COMPLETE_YEARS[1] + 0.5)}%, var(--color-partial) ${pct(COMPLETE_YEARS[1] + 0.5)}%)`);
  const selection = track.append("div").attr("class", "slider-selection");

  const handle = (label, onInput) => slider.append("input")
    .attr("type", "range").attr("min", YEARS[0]).attr("max", YEARS[1]).attr("step", 1)
    .attr("aria-label", label)
    .on("input", onInput);

  let current;
  let timer = null;

  // Year mode only: moves the year forward to the end of the complete period, starting again
  // from its first year when already at the end.
  function play() {
    const [first, last] = COMPLETE_YEARS;
    if (current.year >= last) setState({ year: first });
    timer = d3.interval(() => {
      if (current.year >= last) return stop();
      setState({ year: current.year + 1 });
      if (current.year >= last) stop();
    }, PLAY_STEP);
    playButton.call(playLabel);
  }

  function stop() {
    timer?.stop();
    timer = null;
    playButton.call(playLabel);
  }

  // The chosen years, under their handles: each one follows its handle and opens the year grid.
  // The same limits as the handles.
  function openPicker(button, isStart) {
    const ranged = current.mode !== "year" || current.level === "compare";
    stop();
    picker.open(button, {
      value: isStart ? current.rangeStart : current.year,
      min: isStart ? YEARS[0] : ranged ? current.rangeStart + 1 : YEARS[0],
      max: isStart ? current.year - 1 : YEARS[1],
      range: ranged ? [current.rangeStart, current.year] : null,
      onPick: (y) => setState(isStart ? { rangeStart: y } : { year: y }),
    });
  }

  const playLabel = (button) => button
    .text(timer ? "❚❚ Pause" : "▶ Play")
    .attr("aria-label", timer ? "Pause" : "Play through the years");

  const startHandle = handle("Start of the year range", (event) => {
    stop();
    setState({ rangeStart: Math.min(+event.target.value, current.year - 1) });
  });
  const yearHandle = handle("Selected year", (event) => {
    stop();
    const year = +event.target.value;
    const ranged = current.mode !== "year" || current.level === "compare";
    setState(ranged ? { year: Math.max(year, current.rangeStart + 1) } : { year });
  });

  // Under the track: the two ends as quiet marks, and the chosen years as buttons.
  const ticks = years.append("div").attr("class", "slider-ticks");
  const ends = ticks.selectAll("span").data(YEARS).join("span")
    .style("left", (y) => `${pct(y)}%`)
    .text((y) => y);
  const valueButton = (isStart) => ticks.append("button").attr("type", "button").attr("class", "year-button")
    .attr("aria-haspopup", "dialog").attr("aria-expanded", "false")
    .attr("title", "Choose a year")
    .on("click", function () { openPicker(this, isStart); });
  const startValue = valueButton(true);
  const yearValue = valueButton(false);
  // Two years closer than this (% of the track) are pushed apart, so they never overlap.
  const MIN_GAP = 9;

  const note = root.append("p").attr("class", "control-note");
  playButton.call(playLabel);

  return {
    update(s) {
      current = s;
      // View C always reads a range (its rows are "since rangeStart"), so both handles show and
      // the mode switch, which changes nothing there, is hidden.
      const compare = s.level === "compare";
      const ranged = s.mode !== "year" || compare;
      mode.attr("hidden", compare ? true : null);
      metricSelect.property("value", s.metric);
      modeButtons.attr("aria-pressed", ([key]) => key === s.mode);
      yearsHead.attr("hidden", compare ? true : null); // nothing left in it: no switch, no Play
      const close = ranged && pct(s.year) - pct(s.rangeStart) < MIN_GAP;
      startValue.attr("hidden", ranged ? null : true)
        .style("left", `${pct(s.rangeStart)}%`)
        .classed("is-pushed-left", close)
        .attr("aria-label", `Start year ${s.rangeStart}: choose a year`)
        .text(s.rangeStart);
      yearValue.style("left", `${pct(s.year)}%`)
        .classed("is-pushed-right", close)
        .attr("aria-label", `${ranged ? "End year" : "Year"} ${s.year}: choose a year`)
        .text(s.year);
      const shown = ranged ? [s.rangeStart, s.year] : [s.year];
      ends.attr("hidden", (y) => (shown.some((v) => Math.abs(pct(v) - pct(y)) < MIN_GAP) ? true : null));
      // The start handle flashes once when Change brings it in, so the new control is noticed.
      const appears = ranged && startHandle.attr("hidden") !== null;
      startHandle.property("value", s.rangeStart).attr("hidden", ranged ? null : true)
        .classed("is-new", false);
      if (appears) {
        startHandle.node().offsetWidth; // restart the animation
        startHandle.classed("is-new", true);
      }
      playButton.attr("hidden", ranged ? true : null);
      yearHandle.property("value", s.year);
      selection
        .attr("hidden", ranged ? null : true)
        .style("left", `${pct(s.rangeStart)}%`)
        .style("width", `${pct(s.year) - pct(s.rangeStart)}%`);

      const partialYear = s.year < COMPLETE_YEARS[0] || s.year > COMPLETE_YEARS[1]
        || (ranged && s.rangeStart < COMPLETE_YEARS[0]);
      // In View C the entities are chosen, so the coverage of the map says nothing there.
      note.attr("hidden", compare ? true : null);
      const { available, total } = coverage(s);
      note.selectAll("*").remove();
      note.append("span").text(`${available} of ${total} countries with data`);
      if (partialYear) note.append("span").attr("class", "control-warning").text("Electricity only / partial coverage");
    },
  };
}
