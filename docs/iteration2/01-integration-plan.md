# 2nd Iteration — Integrating Iteration-1 Feedback into the d3.js Build

> Covers: "the integration of the results obtained through the evaluation with development of
> the prototype in d3.js."
>
> This file is also the project's **status and decision log**: what is planned, what is done,
> what was removed and why. Update it in the same change as the code it describes.

## Feedback from the iteration-1 presentation (26/10/2026)

| # | Feedback from the instructors | Change in the d3.js app |
|---|---|---|
| F1 | Personas too generic. Use one (at most two) well-defined persona, and make clear which tasks they do in the UI and why. | One persona, Carla, an energy and environment analyst, with needs N1–N4 and tasks T1–T4. See [01-data-analysis.md §3](../iteration1/01-data-analysis.md#3-target-user). |
| F2 | Mapping 214 countries on one world map is confusing. Start with a continent overview with aggregated metrics, drill down into one continent, and keep a comparison list that can mix countries from different continents. Build Europe plus one other continent first; the rest can be future work. | Two-level navigation: World (6 continents, aggregated) → Continent (its countries). A comparison list persists across levels. Country level for **Europe** and **Asia** first. |
| F3 | The views are poorly correlated: five independent views do not follow the mantra. Use 3–4 screens, each grouping related charts (e.g. a map with a heatmap together with a Marimekko by continent). | Five views regrouped into three coordinated screens (see below). The Marimekko becomes one column per continent or country and is shared by the World and Continent screens. |
| F4 | The objective is too broad and subjective. It must meet one or more needs of the persona. | Concrete objective tied to T1–T4. See [01-data-analysis.md §4](../iteration1/01-data-analysis.md#4-objective). |

## Feedback from the iteration-1 usability tests (26/10/2026)

Raw notes in [../iteration1/03-usability-testing.md](../iteration1/03-usability-testing.md).

| # | Finding (participant) | Change in the d3.js app |
|---|---|---|
| U1 | No units on the radar / country profiles (P1, P5) | Unit on every radar axis label and in the vertex tooltip |
| U2 | The net-change line in the emissions decomposition has no label (P1) | Direct label on the line ("Net change") plus a legend entry |
| U3 | The areas of the difference chart have no label (P2) | Legend for both areas ("clean generation grew more than total generation" / "fossil generation grew") |
| U4 | Units of the energy (Marimekko) view not noticeable enough (P2) | Axis titles with units next to the axes, not only at the bottom |
| U5 | Hard to notice growth when the energy view is in % (P4) | The Marimekko shows TWh in the column widths; the mix over time in View C is in kWh per person, so growth stays visible |
| U6 | Menus confusing, partly due to paper (P3) | No separate "Selection / Comparison" modes; one navigation (World → Continent) and a breadcrumb |
| U7 | Drop the separate comparison/selection modes; use a pop-up to decide whether to compare (P5) | Clicking a country opens a small pop-up with "Details" and "+ Compare"; the comparison list replaces the comparison mode |

## Final design: three coordinated views

Each chart answers one task. Views A and B share one frame: the **map** and the
**Marimekko** stay on screen and change level (continents → countries) instead of being
repeated. Only the third panel changes. All views share the **year**, the **year range**
(two-handle slider), the **metric** and the **comparison list**.

| View | Charts | Mantra | Task |
|---|---|---|---|
| **A. World** | Equal Earth map, continents coloured by the chosen metric (Year / Range average / Change) · Marimekko by continent for the selected year (width = TWh, height = share of each source, top strip = map colour) · stacked area of emissions by continent, absolute MtCO₂e, 2000–2024 | Overview | T1 |
| **B. Continent** (Europe, Asia) | Map zoomed to the continent (all countries) · Marimekko of the top 10 countries by generation + "Others" (click to expand), with compared countries always shown · bubble scatter (x = emissions per capita, log; y = carbon intensity; area = total emissions; colour = renewable share; start → end trail for compared countries) · bars of the change in renewable share over the range, sorted | Zoom and filter | T2, T3 |
| **C. Compare** (≤ 4 countries + World) | One row per country on a shared 2000–2024 axis: mix over time (stacked area by source, kWh per person) · "Clean vs total generation growth" (difference chart) · "Why emissions changed" (demand / mix decomposition, LMDI). Above the rows: one radar with all countries and the World in grey (lowest priority, cut first) | Details on demand, relate | T4 |

### Linking

- **Hover** an entity in any chart → highlighted in every chart of the view.
- **Click** a country → pop-up with *Details* and *+ Compare* (U7). A global **country search**
  does the same from any view, so T3 does not require leaving Europe to add an Asian country.
- **Brush** (2D, bubble scatter only) → highlights the group on the map, in the Marimekko and in
  the sorted bars. It does not add the group to the comparison list (limit of 4).
- **Compared countries** are marked in every chart with an **outline and a label**, not a fill
  colour, so they do not clash with the metric scale, the source colours or the difference
  chart. Their fixed colour is only used in View C (rows, radar) and on the chips.
- **Year** change animates every chart; marks keep their ISO key (object constancy).

### Transitions

- **A → B** (click a continent in any chart): the map zooms to the continent's bounding box;
  the continent's Marimekko column widens and splits into its countries; the emissions area
  is replaced by the scatter and the bars. **B → A** through the breadcrumb.
- **A/B → C** with *Compare →*; **C → B** by clicking a country's name.
- Charts are built static first, with an instant level switch. Animations are added last; if
  they are not working by the end of week 2 the instant switch stays.

### Presentation rules

- Literal chart titles and one "how to read" sentence under each chart; units on every axis
  (U1–U4).
- Charts say **generation**, not demand: OWID generation is used as a proxy for demand, and
  every chart uses the same basis.
- Colour-blind-safe palettes: the change scale and the difference chart do not rely on
  red/green alone.
- Russia counts as Europe (26% of its generation in 2024); this is stated in View B.

## Removed (do not reintroduce without a new decision below)

| Removed | Why | Replacement |
|---|---|---|
| Orthographic globe | Shows half the world; drill-down is simpler on a flat map | Equal Earth map with zoom |
| Five independent views | F3: weak linking, mantra not followed | Three coordinated views |
| Temporal Marimekko | F3 asks for a Marimekko by continent | Marimekko by entity + mix over time in View C |
| Personas Inês and Rui | F1 | Persona Carla |
| Normalised (100%) areas | Hide totals and growth (U5); cannot answer "who emits most" | Absolute areas; kWh per person in View C |
| Difference chart by continent in View A | No task needs it at continent level | Difference chart per country in View C |
| 1D time brush | Does the same as the two-handle slider | Two-handle slider; brushing only in the scatter |

## Status

| Milestone | Status |
|---|---|
| M1 Data: load, preprocess, continent mapping and aggregation, ISO join | Done (`src/js/data/`); continent sums match OWID for 2000–2024 |
| M2 Shared state + View A (static) | Planned |
| M3 View B for Europe (static) | Planned |
| M4 Comparison list, search + View C | Planned |
| M5 View B for Asia; labels and units | Planned |
| M6 Animated transitions, radar | Planned, cut first if late |
| M7 Other continents | Future work |

## Decision log

- **Persona and scope** (F1, F2, F4): one persona, Carla, tasks T1–T4. Two levels,
  World → Continent, built for Europe and Asia first.
- **Three coordinated views** (F3): the map and the Marimekko change level instead of being
  repeated; each chart answers one task (see *Final design*).
- **Continent values** are the sum of their countries (OWID mapping), checked against OWID's
  continent rows for 2000–2024. Russia counts as Europe.
- **Years**: slider 1985–2025, complete period 2000–2024; 1985–1999 and 2025 marked
  *"Electricity only / partial coverage"*; continent-years below 80% coverage hatched;
  time-series charts fixed to 2000–2024.
- **Map**: `world-atlas@2.0.2` 50m, joined to OWID codes through `data/iso-numeric.json`
  (built by `scripts/build-iso-map.mjs` with `i18n-iso-countries`).
- **Tests with classmates** (U1–U7): units and labels everywhere, no separate modes, pop-up
  *Details / + Compare*, absolute values to show growth.
- **Final design review**: absolute emissions area in A, sorted bars for T2,
  kWh per person in C, radar last, outline marking for compared countries, global search,
  no 1D brush.
