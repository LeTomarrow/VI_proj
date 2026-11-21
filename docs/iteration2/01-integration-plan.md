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
| F2 | 214 countries on one world map is confusing. Start with continents, drill down into one, keep a comparison list that mixes continents. Europe plus one other continent first. | World (6 continents, aggregated) → Continent (its countries), built for **Europe** and **Asia**. Each level has its comparison list (continents at World, countries in a continent); View C compares either. |
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

All views share the **year** and the **year range** (two-handle slider, mode Year / Range
average / Change). The **metric** is the map's own control, in its card. The **comparison list**
belongs to a level (below). Views A and B share the map and the mix chart, which change level
instead of being repeated. The app is one of three pages: landing (`index.html`), app
(`app.html`), findings and evaluation (`findings.html`).

| View | Charts | Mantra | Tasks |
|---|---|---|---|
| **A. World** | Equal Earth map of continents by metric (renewable share, carbon intensity, electricity per person) · Marimekko by continent (width = TWh, height = source share; *Rank by* a source, ↓/↑) · stacked area of emissions by continent, MtCO₂e, 2000–2024 | Overview | T1, T2 |
| **B. Continent** (Europe, Asia) | Map zoomed to the continent · ranked bars + mix columns (*Rank by*, ↓/↑, *Top 5 / Top 10 / Compared*) · bubble scatter with 2D brush and *Show: All / ≥ 1 Mt / ≥ 10 Mt* · sorted bars of the change in renewable share with a CO₂ column (↓/↑) | Zoom and filter | T3, T4 |
| **C. Compare** (≤ 5 countries of one continent, or ≤ 5 continents) | Radar per entity on shared scales with a dashed reference (World or the continent) · one row per entity: mix over time (kWh per person; countries only) · clean vs total generation (difference chart) · why emissions changed (decomposition) | Details on demand, relate | T5, T6 |

### Linking and navigation

- **Hover** an entity → highlighted in every chart. **Click** → pop-up (U7).
- **Comparison list**: chips in the sticky filter bar; *Compare →* opens View C (from World with
  continents, from a continent with its countries). Going to World keeps only continents;
  exploring a continent keeps only its countries; View C and the way back keep the list.
- **Brush** (scatter only) highlights the group in every View B chart; *+ Compare* adds it to the
  list, largest emitters first, up to 5.
- **Compared entities** are marked with an outline and ✓ in A and B; their fixed colour is used
  in View C and on the chips.
- **Breadcrumb**: World › Europe › Compare; leaving View C returns to the previous level.
- **Reading a year in View C**: the three columns share one time axis (the range). Hovering a row
  shows one card with its three cells' values; the other rows show their key number at the
  dashed cursor and the radars redraw for that year. Click or Tab pins the year (← →, Esc).

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
| Global country search (*+ Add country…*) | In View B it added countries the screen could not show, so it seemed to do nothing; confusing with a per-level list (user feedback 21/11) | Click a country, + Compare, per level |
| *Fossil share* map metric | ≈ 100 − low-carbon share, and r = 0.93 with carbon intensity (195 countries, 2024); carbon intensity also separates coal from gas | *Electricity per person*, the missing side of the paradox |
| Intro block and About strip inside the app | Crowded the coordinated views; the brief asks for a site | Landing page (`index.html`) and findings page (`findings.html`) |

## Status

| Milestone | Status |
|---|---|
| M1 Data: load, preprocess, continent aggregation, ISO join | Done (`src/js/data/`); continent sums match OWID within 1% for 2000–2024 |
| M2 Shared state + View A | Done: map, Marimekko, emissions area, pop-up, breadcrumb, chips |
| M3 View B (Europe, Asia) | Done: country map, ranked bars + mix, bubble scatter + brush, sorted bars with CO₂e column |
| M4 View C screen (radar + per-entity rows) | Done: *Compare →* from World (continents) or a continent (countries); radars with reference + rows (`charts/compareRows.js`, `mixOverTime.js`, `greenGrowth.js`, `countryProfiles.js`); continents skip the mix column |
| M5 Labels and units | Done for A, B and C (direct labels on the first row of View C) |
| M6 Animations (year, reorder, map zoom, View C entrance) | Done (`motion.js`): marks move on data changes only; map zooms into the continent and back; View C rows fade in with a stagger; off under reduced motion |
| M7 Other continents at country level | Future work |
| M8 Heuristic evaluation (Forsell) + user tests with SUS | Planned (protocols in `02-` and `03-`) |
| M9 Website (landing, findings), slides, video | Landing (`index.html`, `landing.js`, paradox chart) and findings page (`findings.html`, `findings.js`, SUS from `data/sus-results.json`) done; both read `data/summary.json` (`scripts/build-summary.mjs`) or the results file, not the CSV. Slides and video planned; see [../presentation/checklist-30-11.txt](../presentation/checklist-30-11.txt) |

## Decision log

Short form: decision — reason. Dates are 2026. Superseded entries were folded into the one that
replaced them; the *Removed* table keeps what was dropped.

**Data**

- **Persona and scope** (F1, F2, F4) — one persona, two levels, Europe and Asia first.
- **Continent values** — sums of their countries (OWID mapping), shares recomputed from sums,
  never averaged; Russia in Europe.
- **Years** — slider 1985–2025, complete period 2000–2024; partial years marked; continent-years
  below 80% coverage hatched; time series fixed to 2000–2024.
- **CO₂e, not CO₂** — the data is OWID `greenhouse_gas_emissions` (all greenhouse gases from
  electricity, in CO₂ equivalents), so every label says CO₂e.
- **Map metrics** — renewable share, carbon intensity and electricity per person: the three sides
  of the paradox. Fossil share was dropped (see Removed).

**Encoding**

- **Map** — `world-atlas` 50m joined through `data/iso-numeric.json`; the country level uses an
  equal-area projection fitted to a fixed box per continent, so Russia does not stretch it.
- **Colours** — Change scale blue (cleaner) ↔ red (dirtier); electricity per person is neither,
  so purple ↔ orange; sequential scales on fixed domains, so a colour change is a data change.
  Source, continent and the 5 compared-country colours checked for colour blindness (worst
  all-pairs CVD ΔE 10.7); a compared country keeps its colour while it stays in the list.
- **Marimekko (A)** — 8 series at most (bioenergy and other renewables share a colour); x axis
  fixed to the largest yearly total, so columns grow (U5).
- **Ranked bars + mix (B, instructor's tip)** — the country Marimekko became bars of the ranked
  value (TWh) over equal-width mix columns, *Top 5 / Top 10 / Compared*: one dominant country
  squeezed the rest and no task needs a country's slice of the continent.
- **Rank and sort** — *Rank by* and ↓/↑ in the Marimekko (ranked sources at the base) and the
  sorted bars; not on the map, scatter or emissions area, where order has no meaning.
- **Bubble scatter (B)** — x = emissions per person (log), y = carbon intensity, area = total
  emissions, colour = renewable share; axes fixed per continent; World lines make four labelled
  corners; *Show: All / ≥ 1 Mt / ≥ 10 Mt* hides small emitters; names placed where they fit.
- **Sorted bars (B)** — gain in renewable share over the range, World dashed, CO₂e column ▼/▲
  with %, so each row answers T3 alone.

**Interaction**

- **One navigation** (U6, U7) — World → Continent → Compare with a breadcrumb; one click opens
  *Explore countries →* / *+ Compare* instead of hidden gestures.
- **Comparison list** — continents **or** countries, 5 at most (= *Top 5* and the 5 colours);
  it belongs to a level (World keeps continents, a continent its own countries), so T5 compares
  countries against their continent. Chips, *Clear all* and *Compare →* sit in the sticky
  filter bar, in reach while scrolling.
- **Focus on compared entities** — others fade in categorical charts, never on the map (lighter
  would read as lower); the emissions chart switches to one line per compared continent.
- **Brush (B)** — a region in data units per continent, so it follows the year; highlights the
  group in every View B chart; *+ Compare* adds it, largest emitters first, up to 5 (10 would
  need 10 colour-blind-safe colours); *Clear all* also clears it.
- **Motion** — one duration (500 ms, ease-out); marks move only when the data shown changes,
  never on hover; keyed joins keep each mark; the drill-down zooms the map into the continent
  (700 ms); everything off under `prefers-reduced-motion`.

**View C**

- **Its own screen** — the colleague's single-country *Green growth* mode (difference chart +
  LMDI decomposition) answered T6 but cleared the comparison; it became one row per compared
  entity, with the radars above. Plain labels: "more or less electricity" / "different way of
  making it". Continents skip the mix column (View A already shows it).
- **Scales** — the mix column shares one kWh-per-person scale (U5); the change columns use one
  scale per row, because T6 is read within a row and Portugal would be flat next to China.
- **Reading one year (critique 25/40)** — all columns share the range's time axis; View C always
  shows both slider handles and hides the mode switch; one card per hovered row with its three
  cells, the key number at the cursor in the other rows (one card per row would hide them), the
  radars follow the year; click or Tab pins it (← →, Esc).
- **Legends** — only the marks not named in place (the first row labels its lines).

**Site and evaluation**

- **Three pages** — landing (the paradox, data, how to explore with each chart's D3 source,
  authors), app, findings (conclusions, Forsell summary, SUS): the brief asks for a site, and
  the intro inside the app crowded the views. The landing reads a 16 KB summary built by the
  app's own preprocessing, so it opens at once.
- **Evaluation** — Forsell & Johansson's 10 heuristics by both authors; user tests with 3–5
  participants and SUS.
- **Tests per view** — the pure logic lives in `src/js/data/`, so `node --test` covers it
  without a DOM; each view's test file also checks its tasks' expected answers and the landing
  numbers on the real CSV, so a data change cannot silently break a test session or a slide.
- **Review passes (21/11)** — an Impeccable critique, polish and distill, then a code review:
  overlapping names, focus rings, one column below 900 px, landing kickers removed; one
  `MAX_COMPARED`; View C opened at 1985 now gets a non-empty range. Kept on purpose: *Range
  average*, the Globe switch, the full *Rank by* list and View C's mix column.
