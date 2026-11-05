// Shared controls: metric, mode, year slider (second handle in the range modes), play, coverage.

import { COMPLETE_YEARS, YEARS } from "./data/constants.js";
import { METRICS, MODES } from "./scales.js";
import { setState } from "./state.js";

const pct = (year) => (100 * (year - YEARS[0])) / (YEARS[1] - YEARS[0]);
const PLAY_STEP = 1000; // ms per year

export function createControls(selector, { coverage }) {
  const root = d3.select(selector);

  const metric = root.append("label").attr("class", "control");
  metric.append("span").attr("class", "control-label").text("Metric");
  const metricSelect = metric.append("select").on("change", (event) => setState({ metric: event.target.value }));
  metricSelect.selectAll("option").data(Object.entries(METRICS)).join("option")
    .attr("value", ([key]) => key)
    .text(([, m]) => m.label);

  const mode = root.append("div").attr("class", "control");
  mode.append("span").attr("class", "control-label").text("Show");
  const modeButtons = mode.append("div").attr("class", "segmented").attr("role", "group")
    .selectAll("button").data(Object.entries(MODES)).join("button")
    .attr("type", "button")
    .text(([, label]) => label)
    .on("click", (_, [key]) => { stop(); setState({ mode: key }); });

  const years = root.append("div").attr("class", "control control-years");
  const yearsHead = years.append("div").attr("class", "control-head");
  const yearsLabel = yearsHead.append("span").attr("class", "control-label");
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
    setState(current.mode === "year" ? { year } : { year: Math.max(year, current.rangeStart + 1) });
  });

  const ticks = years.append("div").attr("class", "slider-ticks");
  ticks.selectAll("span").data([YEARS[0], ...COMPLETE_YEARS]).join("span")
    .style("left", (y) => `${pct(y)}%`)
    .text((y) => y);

  const note = root.append("p").attr("class", "control-note");
  playButton.call(playLabel);

  return {
    update(s) {
      current = s;
      const ranged = s.mode !== "year";
      metricSelect.property("value", s.metric);
      modeButtons.attr("aria-pressed", ([key]) => key === s.mode);
      yearsLabel.text(ranged ? `Years ${s.rangeStart}–${s.year}` : `Year ${s.year}`);
      startHandle.property("value", s.rangeStart).attr("hidden", ranged ? null : true);
      playButton.attr("hidden", ranged ? true : null);
      yearHandle.property("value", s.year);
      selection
        .attr("hidden", ranged ? null : true)
        .style("left", `${pct(s.rangeStart)}%`)
        .style("width", `${pct(s.year) - pct(s.rangeStart)}%`);

      const partialYear = s.year < COMPLETE_YEARS[0] || s.year > COMPLETE_YEARS[1]
        || (ranged && s.rangeStart < COMPLETE_YEARS[0]);
      const { available, total } = coverage(s);
      note.selectAll("*").remove();
      note.append("span").text(`${available} of ${total} countries with data`);
      if (partialYear) note.append("span").attr("class", "control-warning").text("Electricity only / partial coverage");
    },
  };
}
