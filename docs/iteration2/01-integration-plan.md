# 2nd Iteration: Integration Plan, Status and Decisions

> Brief: "the integration of the results obtained through the evaluation with development of
> the prototype in d3.js." This file is also the project's **status and decision log**. Update
> it in the same change as the code.

App: **Green Paradox**, *Greener, but not cleaner? The global electricity transition.*

## Feedback from the iteration-1 presentation (26/10)

| # | Instructors' feedback | Change in the app |
|---|---|---|
| F1 | Personas too generic: one persona, with clear tasks in the UI | Persona Carla, tasks T1-T6 ([01-data-analysis.md §3](../iteration1/01-data-analysis.md#3-target-user)) |
| F2 | 214 countries on one map is confusing: start with continents, drill down, compare; Europe and one other continent first | World (6 continents) to Continent (its countries), built for **Europe** and **Asia**; a comparison list per level; View C compares either |
| F3 | Five independent views break the mantra: use 3-4 screens of related charts | Three coordinated screens |
| F4 | Objective too broad | Objective tied to the tasks ([§4](../iteration1/01-data-analysis.md#4-objective)) |

## Feedback from the iteration-1 usability tests (26/10)

Notes: [../iteration1/03-usability-testing.md](../iteration1/03-usability-testing.md).

| # | Finding (participant) | Change in the app |
|---|---|---|
| U1 | No units on the radar (P1, P5) | Unit on every radar axis and tooltip |
| U2 | Net-change line of the decomposition unlabelled (P1) | Direct label and legend entry |
| U3 | Difference-chart areas unlabelled (P2) | Legend for both areas |
| U4 | Marimekko units hard to see (P2) | Axis titles with units |
| U5 | Growth hard to see in % (P4) | Widths in TWh in the Marimekko; kWh per person in View C |
| U6 | Menus confusing (P3) | One navigation, World to Continent to Compare, with a breadcrumb |
| U7 | Use a pop-up to decide whether to compare (P5) | Click opens a pop-up: *Explore countries* / *+ Compare* |

## Final design: three coordinated views

All views share the **year** and the **year range** (two-handle slider; modes Year, Range
average, Change). The **metric** is a control of the map card. Each level has its own
**comparison list**. Views A and B reuse the map and the mix chart at a different level. The
site has three pages: landing (`index.html`), app (`app.html`), findings (`findings.html`).

| View | Charts | Mantra | Tasks |
|---|---|---|---|
| **A. World** | Equal Earth map of continents (renewable share, carbon intensity, electricity per person); Marimekko by continent (width = TWh, height = share; *Rank by*, ↓/↑); stacked area of emissions by continent, MtCO₂e, 2000-2024 | Overview | T1, T2 |
| **B. Continent** (Europe, Asia) | Map zoomed to the continent; ranked bars over mix columns (*Rank by*, ↓/↑, *Top 5 / Top 10 / Compared*); bubble scatter with 2D brush and *Show: All / ≥ 1 Mt / ≥ 10 Mt*; sorted bars of the renewable-share gain with a CO₂e column | Zoom and filter | T3, T4 |
| **C. Compare** (up to 5 countries of one continent, or 5 continents) | Radars on shared scales with a dashed reference (World or the continent); one row per entity: mix over time (kWh per person, countries only), clean vs total generation (difference chart), why emissions changed (decomposition) | Details on demand, relate | T5, T6 |

### Linking and navigation

- **Hover** highlights an entity in every chart. **Click** opens the pop-up (U7).
- **Comparison list**: chips in the sticky filter bar; *Compare* opens View C. World keeps only
  continents; a continent keeps only its countries; View C and the way back keep the list.
- **Brush** (scatter only) highlights the group in every View B chart; *+ Compare* adds it,
  largest emitters first, up to 5. The brush and the comparison are independent: while both
  exist, the scatter and the sorted bars show the brushed group plus the compared countries.
- **Compared entities** have an outline and ✓ in A and B, and a fixed colour in View C and the chips.
- **Breadcrumb**: World › Europe › Compare; leaving View C returns to the previous level.
- **One year in View C**: the three columns share the range's time axis. Hovering a row shows
  one card with its three values; other rows show their key number at the dashed cursor; the
  radars redraw for that year. Click or Tab pins the year (← →, Esc).

### Presentation rules

- Literal titles, one short reading line per chart, units on every axis (U1-U4).
- Charts say **generation**, not demand (OWID generation is the proxy).
- Colour-blind-safe palettes: change scales are blue ↔ red, never green/red alone.
- Russia counts as Europe, stated in View B.

## Removed (do not reintroduce without a new decision below)

| Removed | Why | Replacement |
|---|---|---|
| Orthographic globe as main view | Shows half the world | Equal Earth map (Map / Globe switch kept as an experiment) |
| Five independent views | F3 | Three coordinated views |
| Temporal Marimekko | F3 asks for a Marimekko by continent | Marimekko by continent; mix over time in View C |
| Personas Inês and Rui | F1 | Persona Carla |
| Normalised (100%) areas | Hide totals and growth (U5) | Absolute areas; kWh per person |
| Difference chart by continent in View A | No task needs it there | Difference chart per entity in View C |
| 1D time brush | Same as the two-handle slider | Slider; brushing only in the scatter |
| Country Marimekko in View B (*All*, Others / Largest, magnified copies, axis breaks) | China or Russia take half the axis, *Others* hides most countries, no task needs a country's slice | Ranked bars over mix columns; every country stays on the map and in the sorted bars |
| Map-colour strip above Marimekko columns | Repeats the map | Hover and click linking |
| Horizontal rows for the ranked chart | Tried, reverted by the team | Vertical bars over mix columns |
| Change-vs-change scatter, CO₂ bar column, dumbbell | Asian emissions grow by hundreds of % and pin marks to the edge | Level scatter; ▼/▲ CO₂e column with % |
| *Green growth* single-country mode (own start-year input) | Cleared the comparison list, hid the compare bar, one country only, red/green colours | Rows of View C, using the range slider |
| Radar as a tab of View B | Belongs to the comparison (T5) | Top of View C |
| Global country search (*+ Add country*) | In View B it added countries the screen could not show; confusing with a per-level list (feedback 21/11) | Click a country, *+ Compare*, per level |
| *Fossil share* map metric | About 100 minus low-carbon share; r = 0.93 with carbon intensity (195 countries, 2024) | *Electricity per person* |
| Intro block and About strip inside the app | Crowded the views; the brief asks for a site | Landing and findings pages |
| Landing *The paradox* cards; landing charts indexed to 2000 = 100 | Cards repeated the hero numbers; readers found the index confusing (feedback 25/11) | % change since 2000 in the hero numbers and both charts; chart sources in one *details* block |

## Status

| Milestone | Status |
|---|---|
| M1 Data: load, preprocess, continent sums, ISO join | Done (`src/js/data/`); continent sums match OWID within 1% for 2000-2024 |
| M2 Shared state + View A | Done: map, Marimekko, emissions area, pop-up, breadcrumb, chips |
| M3 View B (Europe, Asia) | Done: map, ranked bars + mix, bubble scatter + brush, sorted bars with CO₂e column |
| M4 View C | Done: radars with reference and rows (`charts/compareRows.js`, `mixOverTime.js`, `greenGrowth.js`, `countryProfiles.js`); continents skip the mix column |
| M5 Labels and units | Done for A, B and C |
| M6 Animations | Done (`motion.js`): year, reorder, map zoom, View C entrance; off under reduced motion |
| M7 Other continents at country level | Future work |
| M8 Heuristic evaluation + user tests with SUS | In progress: heuristic findings being collected ([02-](02-heuristic-evaluation.md)); user tests planned ([03-](03-user-testing.md)) |
| M9 Website, slides, video | Landing and findings done (read `data/summary.json` and `data/sus-results.json`, not the CSV). Slides and video planned ([checklist](../presentation/checklist-30-11.txt)) |

## Decision log

Form: decision, then reason. Dates are 2026. Superseded entries were merged into the one that
replaced them; the *Removed* table keeps what was dropped.

**Data**

- **Persona and scope** (F1, F2, F4): one persona, two levels, Europe and Asia first.
- **Continent values**: sums of their countries (OWID mapping); shares recomputed from sums,
  never averaged; Russia in Europe.
- **Years**: slider 1985-2025, complete period 2000-2024; partial years marked; continent-years
  below 80% coverage hatched; time series fixed to 2000-2024.
- **CO₂e, not CO₂**: OWID `greenhouse_gas_emissions` counts all greenhouse gases, so every label says CO₂e.
- **Map metrics**: renewable share, carbon intensity, electricity per person (the three sides
  of the paradox).

**Encoding**

- **Map**: `world-atlas` 50m joined through `data/iso-numeric.json`; the country level uses an
  equal-area projection fitted to a fixed box per continent, so Russia does not stretch it.
- **Colours**: change scale blue (cleaner) ↔ red (dirtier); electricity per person is neither,
  so purple ↔ orange; sequential scales on fixed domains. Source, continent and the 5 compared
  colours checked for colour blindness (worst pair CVD ΔE 10.7); a compared country keeps its colour.
- **Marimekko (A)**: 8 series at most (bioenergy and other renewables share a colour); x axis
  fixed to the largest yearly total, so columns grow (U5).
- **Ranked bars + mix (B, instructor's tip)**: one dominant country squeezed the country
  Marimekko, and no task needs a country's slice.
- **Rank and sort**: *Rank by* and ↓/↑ in the Marimekko and the sorted bars only; on the map,
  scatter and emissions area order has no meaning.
- **Bubble scatter (B)**: x = emissions per person (log), y = carbon intensity, area = total
  emissions, colour = renewable share; axes fixed per continent; World lines make four labelled
  corners; *Show* hides small emitters; names placed where they fit.
- **Sorted bars (B)**: renewable-share gain over the range, World dashed, CO₂e column ▼/▲ with
  %, so each row answers T3 alone.

**Interaction**

- **One navigation** (U6, U7): World to Continent to Compare with a breadcrumb; one click opens
  the pop-up instead of hidden gestures.
- **Comparison list**: continents **or** countries, 5 at most (= *Top 5* and the 5 colours);
  it belongs to a level, so T5 compares countries with their continent. Chips, *Clear all* and
  *Compare* sit in the sticky filter bar.
- **Focus on compared entities**: others fade in categorical charts, never on the map (lighter
  would read as lower); the emissions chart switches to one line per compared continent.
- **Brush (B)**: a region in data units, so it follows the year; *+ Compare* adds the group,
  largest emitters first, up to 5 (10 would need 10 colour-blind-safe colours).
- **Brush with a comparison (heuristic evaluation #12-16)**: adding one country to the comparison switched the
  scatter to compared-only, which emptied the brush ("0 countries selected"). Now the brush
  ignores the comparison: with both, the scatter and bars show the brushed group plus the
  compared countries; without a brush, compared-only as before. Compared countries are never
  faded by the brush (they were near invisible in the bars). An empty brush counts as no brush
  (it faded every chart and emptied the bars). Narrow scatter: a row of quadrant labels that
  would overlap keeps only the bold one. Mix chart: a brushed group outside the Top N faded every
  column; now its countries follow the compared ones on the right (up to 5, by the ranking). Showing every country was
  rejected (overlapping bubbles); the limit stays 5, and only the comparison goes to View C.
- **Motion**: 500 ms ease-out; marks move only when the data changes, never on hover; keyed
  joins; the drill-down zooms the map (700 ms); off under `prefers-reduced-motion`.

**View C**

- **Own screen**: the single-country *Green growth* mode answered T6 but cleared the
  comparison; it became one row per compared entity, with the radars above. Plain labels:
  "more or less electricity" / "different way of making it". Continents skip the mix column.
- **Scales**: the mix column shares one kWh-per-person scale (U5); the change columns use one
  scale per row, because T6 is read within a row and Portugal would be flat next to China.
- **Reading one year (critique 25/40)**: shared time axis; both slider handles always shown;
  one card per hovered row, key numbers at the cursor in the other rows; radars follow the year.
- **Legends**: only for marks not named in place.

**Site and evaluation**

- **Three pages**: the brief asks for a site, and the intro inside the app crowded the views.
  The landing reads a 16 KB summary built by the app's own preprocessing, so it opens at once.
- **Simpler landing (25/11)**: hero (question, three numbers, World chart), *Two continents*,
  *How to explore* (three steps; D3 sources in a closed *details*), data, authors. Numbers and
  charts read as % change since 2000. Findings: one bold claim and one short line each; the
  test section names Carla and the tasks T1-T6 the testers did as her.
- **Evaluation**: Forsell & Johansson's 10 heuristics by both authors; user tests with 3-5
  participants and SUS.
- **Tests per view**: the pure logic lives in `src/js/data/`, so `node --test` runs without a
  DOM; each test file checks its tasks' answers and the landing numbers on the real CSV.
- **Review passes (21/11)**: Impeccable critique, polish and distill, then a code review:
  overlapping names, focus rings, one column below 900 px, one `MAX_COMPARED`, a non-empty View C
  range from 1985. Kept on purpose: *Range average*, the Globe switch, the full *Rank by* list,
  View C's mix column.
- **Short docs (25/11)**: docs rewritten shorter, without em- or en-dashes; stub READMEs now
  describe what the folders hold.
