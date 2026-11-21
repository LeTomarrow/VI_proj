# 2nd Iteration — Integrating Iteration-1 Feedback into the d3.js Build

> Covers: "the integration of the results obtained through the evaluation with development of
> the prototype in d3.js."
>
> This file is also the project's **status and decision log**: what is planned, what is done,
> what was removed and why. Update it in the same change as the code it describes.

App name: **Green Paradox** — *Greener, but not cleaner? The global electricity transition.*

## Feedback from the iteration-1 presentation (26/10/2026)

| # | Feedback from the instructors | Change in the d3.js app |
|---|---|---|
| F1 | Personas too generic. Use one well-defined persona and make clear which tasks they do in the UI. | One persona, Carla, energy and environment analyst, tasks T1–T6. See [01-data-analysis.md §3](../iteration1/01-data-analysis.md#3-target-user). |
| F2 | 214 countries on one world map is confusing. Start with continents, drill down into one, keep a comparison list that mixes continents. Europe plus one other continent first. | World (6 continents, aggregated) → Continent (its countries), built for **Europe** and **Asia**. A comparison list persists across levels. |
| F3 | Five independent views do not follow the mantra. Use 3–4 screens of related charts. | Three coordinated screens (below). |
| F4 | Objective too broad and subjective. | Objective tied to the persona's tasks. See [01-data-analysis.md §4](../iteration1/01-data-analysis.md#4-objective). |

## Feedback from the iteration-1 usability tests (26/10/2026)

Raw notes in [../iteration1/03-usability-testing.md](../iteration1/03-usability-testing.md).

| # | Finding (participant) | Change in the d3.js app |
|---|---|---|
| U1 | No units on the radar (P1, P5) | Unit on every radar axis and tooltip |
| U2 | Net-change line of the decomposition unlabelled (P1) | Direct label + legend entry |
| U3 | Areas of the difference chart unlabelled (P2) | Legend for both areas |
| U4 | Units of the Marimekko not noticeable (P2) | Axis titles with units next to the axes |
| U5 | Growth hard to see in % (P4) | Absolute widths (TWh) in the Marimekko; kWh per person in View C |
| U6 | Menus confusing (P3) | One navigation (World → Continent → Compare) with a breadcrumb |
| U7 | Use a pop-up to decide whether to compare (P5) | Click opens a pop-up with *Explore countries →* / *+ Compare* |

## Final design: three coordinated views

All views share the **year**, the **year range** (two-handle slider), the **metric** and the
**comparison list**. Views A and B share the map and the mix chart, which change level instead
of being repeated.

| View | Charts | Mantra | Tasks |
|---|---|---|---|
| **A. World** | Equal Earth map of continents by metric (Year / Range average / Change) · Marimekko by continent (width = TWh, height = source share) · stacked area of emissions by continent, MtCO₂e, 2000–2024 | Overview | T1, T2 |
| **B. Continent** (Europe, Asia) | Map zoomed to the continent · ranked bars + mix columns (*Rank by*, *Top 5 / Top 10 / Compared*) · bubble scatter with 2D brush · sorted bars of the change in renewable share with a CO₂ column | Zoom and filter | T3, T4 |
| **C. Compare** (≤ 4 countries or ≤ 5 continents) | Radar per entity on shared scales · one row per entity on a shared time axis: mix over time (kWh per person) · clean vs total generation (difference chart) · why emissions changed (decomposition) | Details on demand, relate | T5, T6 |

### Linking and navigation

- **Hover** an entity → highlighted in every chart. **Click** → pop-up (U7).
- **Comparison list**: chips next to the breadcrumb; a *+ Add country…* search adds any country
  from any screen; *Compare →* opens View C. The list is never cleared by navigation.
- **Brush** (scatter only) highlights the group in every View B chart; it is not added to the list.
- **Compared entities** are marked with an outline and ✓ in A and B; their fixed colour is used
  in View C and on the chips.
- **Breadcrumb**: World › Europe › Compare; leaving View C returns to the previous level.

### Presentation rules

- Literal titles, one short reading line per chart, units on every axis (U1–U4).
- Charts say **generation**, not demand (OWID generation is the proxy).
- Colour-blind-safe palettes: change scales are blue ↔ red, never green/red alone.
- Russia counts as Europe; stated in View B.

## Removed (do not reintroduce without a new decision below)

| Removed | Why | Replacement |
|---|---|---|
| Orthographic globe as main view | Shows half the world | Equal Earth map (a Map / Globe switch remains as an experiment) |
| Five independent views | F3 | Three coordinated views |
| Temporal Marimekko | F3 asks for a Marimekko by continent | Marimekko by continent + mix over time in View C |
| Personas Inês and Rui | F1 | Persona Carla |
| Normalised (100%) areas | Hide totals and growth (U5) | Absolute areas; kWh per person |
| Difference chart by continent in View A | No task needs it there | Difference chart per entity in View C |
| 1D time brush | Same as the two-handle slider | Slider; brushing only in the scatter |
| Marimekko of the countries (View B *All*, Others / Largest, magnified copies, axis breaks) | China or Russia take half the axis, *Others* hides most countries; no task asks for a country's slice of the continent | Ranked bars + mix; every country stays on the map and in the sorted bars |
| Map-colour strip above Marimekko columns | Repeats the map, clutter | Hover/click linking |
| Horizontal rows layout for the ranked chart | Tried, reverted by the team | Vertical bars above mix columns |
| Change-vs-change scatter, CO₂ bar column, dumbbell | Asian emissions grow by hundreds of % and pin marks to the edge | Level scatter; ▼/▲ CO₂ column with % |
| *Green growth* single-country mode (and its own start-year input) | Cleared the comparison list, hid the compare bar, one country only while T6 is per compared country, red/green colours | Rows of View C, using the range slider |
| Radar as a tab of View B | Belongs to the comparison (T5) | Top of View C |

## Status

| Milestone | Status |
|---|---|
| M1 Data: load, preprocess, continent aggregation, ISO join | Done (`src/js/data/`); continent sums match OWID within 1% for 2000–2024 |
| M2 Shared state + View A | Done: map, Marimekko, emissions area, pop-up, breadcrumb, chips |
| M3 View B (Europe, Asia) | Done: country map, ranked bars + mix, bubble scatter + brush, sorted bars with CO₂ column |
| M4 View C screen (radar + per-entity rows) | In progress: radar and the decomposition charts exist; the screen does not |
| M4b Global country search | Planned |
| M5 Labels and units | Done for A and B |
| M6 Animations (year, reorder, map zoom, View C entrance) | Planned |
| M7 Other continents at country level | Future work |
| M8 Heuristic evaluation (Forsell) + user tests with SUS | Planned (protocols in `02-` and `03-`) |
| M9 Website context (intro, findings), slides, video | Planned; see [../presentation/checklist-30-11.txt](../presentation/checklist-30-11.txt) |

## Decision log

Short form: decision — reason. Dates are 2026.

- **Persona and scope** (F1, F2, F4) — one persona, two levels, Europe and Asia first.
- **Continent values** — sums of their countries (OWID mapping), shares recomputed from sums;
  Russia in Europe.
- **Years** — slider 1985–2025, complete period 2000–2024; partial years marked; continent-years
  below 80% coverage hatched; time series fixed to 2000–2024.
- **Map** — `world-atlas@2.0.2` 50m joined through `data/iso-numeric.json`. Country level uses an
  azimuthal equal-area projection fitted to a fixed box per continent (Europe 24° W–42° E,
  35–71° N; Asia 26–146° E, 10° S–54° N), so Russia does not stretch it.
- **Colours** — Change scale blue (cleaner) ↔ red (dirtier); sequential scales on fixed domains
  (0–100%, 0–800 gCO₂/kWh); source, continent and compared-country palettes checked with a
  colour-blindness validator (worst all-pairs CVD ΔE 10.7).
- **Marimekko (A)** — bioenergy and other renewables share a colour (8 series max); x axis fixed
  to the largest yearly total so columns grow (U5); fixed continent order.
- **Layout** — the page fills the window; charts drawn at the panel's real size; hover zones of
  at least 12–18 px; hover outlines instead of fading.
- **Play and sticky filters** — filter bar stays on top; Play (Year mode) advances to 2024.
- **Pop-up actions** (U7) — one click opens *Explore countries →* / *+ Compare* instead of hidden
  gestures. The list holds continents **or** countries (no chart compares a continent with a
  country): 5 continents or 4 countries; adding the other type replaces the list.
- **Focus on compared continents (A)** — others fade to 30% in the Marimekko, not on the map
  (lighter would read as lower). Emissions chart switches from stack to one line per compared
  continent, from zero, so thin bands can be compared.
- **Ranked bars + mix (B, instructor's tip 11/2026)** — the country Marimekko was deconstructed
  into bars of the ranked value (TWh) over equal-width mix columns, *Rank by* any source,
  *Top 5 / Top 10 / Compared*. The *All* Marimekko and its workarounds were then removed (see
  Removed): one dominant country squeezed the rest, and the persona's tasks never need it.
- **Bubble scatter (B)** — x = emissions per person (log), y = carbon intensity, area = total
  emissions, colour = renewable share; axes fixed per continent over 2000–2024; World lines split
  four labelled corners; compared countries show their path over the range.
- **Sorted bars (B)** — gain in renewable share (pp) over the range, World as a dashed line, CO₂
  column ▼ fell / ▲ rose with % so each row answers T3 alone; *Top 10 / All*.
- **Brush (B)** — stored in data units per continent, so it follows the year; highlights the
  group everywhere; the map outlines it with dashes instead of fading.
- **Compared colours** — 5 fixed colours (violet, crimson, teal, olive, `#0088ee`); a country
  keeps its colour while it stays in the list.
- **Clear all** — with 2+ entries a link empties the list in one click.
- **View C as its own screen (21/11)** — the colleague's *Green growth* mode (difference chart +
  LMDI decomposition, `data/greenGrowth.js`, tested) answered T6 but for one country, and
  entering it cleared the comparison. It becomes the per-entity rows of View C, opened with
  *Compare →*; the radar moves there too. Labels avoid jargon: "because it made more
  electricity" / "because it changed how it makes it".
- **Global search (21/11)** — *+ Add country…* in the comparison bar adds any country from any
  screen, so comparing across continents (T5) needs no detour through World.
- **Evaluation (21/11)** — heuristic evaluation with Forsell & Johansson's 10 InfoVis heuristics
  by both authors (visualisation quality); user tests with 3–5 participants and SUS (perceived
  usability).
