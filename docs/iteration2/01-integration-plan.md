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
**mix chart** stay on screen and change level (Marimekko of continents → ranked bars + mix of
countries) instead of being
repeated. Only the third panel changes. All views share the **year**, the **year range**
(two-handle slider), the **metric** and the **comparison list**.

| View | Charts | Mantra | Task |
|---|---|---|---|
| **A. World** | Equal Earth map, continents coloured by the chosen metric (Year / Range average / Change) · Marimekko by continent for the selected year (width = TWh, height = share of each source) · stacked area of emissions by continent, absolute MtCO₂e, 2000–2024 | Overview | T1 |
| **B. Continent** (Europe, Asia) | Map zoomed to the continent (all countries) · countries ranked by a chosen value (total generation, low-carbon, fossil or one source): *Top 5 / Top 10* as bars of that value (TWh) above equal-width mix columns; with 2+ compared countries, *Compared* shows only them in that layout; compared countries outside the top N always shown · bubble scatter (x = emissions per capita, log; y = carbon intensity; area = total emissions; colour = renewable share; start → end trail for compared countries) · bars of the change in renewable share over the range, sorted | Zoom and filter | T2, T3 |
| **C. Compare** (≤ 5 countries + World) | One row per country on a shared 2000–2024 axis: mix over time (stacked area by source, kWh per person) · "Clean vs total generation growth" (difference chart) · "Why emissions changed" (demand / mix decomposition, LMDI). Above the rows: one radar with all countries and the World in grey (lowest priority, cut first) | Details on demand, relate | T4 |

### Linking

- **Hover** an entity in any chart → highlighted in every chart of the view.
- **Click** a country → pop-up with *Details* and *+ Compare* (U7). A global **country search**
  does the same from any view, so T3 does not require leaving Europe to add an Asian country.
- **Brush** (2D, bubble scatter only) → highlights the group on the map, in the Marimekko and in
  the sorted bars. It does not add the group to the comparison list (limit of 5).
- **Compared countries** are marked in every chart with an **outline and a label**, not a fill
  colour, so they do not clash with the metric scale, the source colours or the difference
  chart. Their fixed colour is only used in View C (rows, radar) and on the chips.
- **Year** change animates every chart; marks keep their ISO key (object constancy).

### Transitions

- **A → B** (click a continent in any chart): the map zooms to the continent's bounding box;
  the Marimekko of the continents gives way to the continent's ranked countries; the emissions area
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
| Orthographic globe | Shows half the world; drill-down is simpler on a flat map | Equal Earth map with zoom (a Map / Globe switch is being tried, see the decision log) |
| Five independent views | F3: weak linking, mantra not followed | Three coordinated views |
| Temporal Marimekko | F3 asks for a Marimekko by continent | Marimekko by entity + mix over time in View C |
| Personas Inês and Rui | F1 | Persona Carla |
| Normalised (100%) areas | Hide totals and growth (U5); cannot answer "who emits most" | Absolute areas; kWh per person in View C |
| Difference chart by continent in View A | No task needs it at continent level | Difference chart per country in View C |
| 1D time brush | Does the same as the two-handle slider | Two-handle slider; brushing only in the scatter |
| Marimekko of the countries (View B *All*, Others / Largest, magnified copies) | Serves no persona task (no task asks what slice of the continent each country is); China or Russia take half the axis and *Others* hides most countries, so it confused more than it showed | Ranked bars + mix (*Top 5 / Top 10*, *Compared*); every country stays on the map and in the sorted bars |
| Map-colour strip above the Marimekko columns | Repeats the map's colour and clutters the chart; the link is made by selecting on the map | Hover and click link the map and the Marimekko (outline, ✓) |

## Status

| Milestone | Status |
|---|---|
| M1 Data: load, preprocess, continent mapping and aggregation, ISO join | Done (`src/js/data/`); continent sums match OWID for 2000–2024 |
| M2 Shared state + View A (static) | Done: state, controls, map, Marimekko and emissions area (`src/js/state.js`, `controls.js`, `charts/`); clicking a continent opens the pop-up (`entityMenu.js`) with *Explore countries →* and *+ Compare*; breadcrumb and comparison chips (`navigation.js`). The continent level is a placeholder until M3 |
| M3 View B for Europe (static) | Done for Europe and Asia: country map, ranked bars + mix of the countries (*Rank by*, *Compared / Top 5 / Top 10*), bubble scatter with a brush linked to the map, the Marimekko and the sorted bars of the change in renewable share (`charts/map.js`, `charts/marimekko.js`, `data/countryColumns.js`, `charts/bubbleScatter.js`, `charts/changeBars.js`) |
| M4 Comparison list, search + View C | In progress: comparison list (continents or countries); the radar (`charts/countryProfiles.js`) is a tab of the View B panel until the View C screen exists |
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
- **Colours (View A)**: the Change scale is blue (cleaner) ↔ red (dirtier) with a pale midpoint,
  replacing iteration 1's green/red, so it does not rely on red/green. Sequential scales use one
  hue on fixed domains (0–100%, 0–800 gCO₂/kWh; Change ±30 pp, ±250 gCO₂/kWh), the same for
  every year. Source and continent palettes were checked with a colour-blindness validator.
- **Marimekko (View A)**: bioenergy and other renewables share one colour (8 series at most) and
  the tooltip gives both parts. The x axis is fixed to the largest yearly total, so columns grow
  over the years instead of always filling the chart (U5). The continent order is fixed.
- **Page**: the template's Overview / Zoom / Details stubs were removed; the title is the theme
  until the app has a name.
- **Map / Globe switch (experiment)**: the World map has a switch to an orthographic globe that
  rotates by dragging, to see whether users like it. The flat map stays the default because the
  globe shows half the world at once, so it cannot show all six continents for T1. Keep or remove
  it after the tests.
- **View A layout and hover (review)**: the page fills the window so the three charts are seen
  together (map and Marimekko on top, emissions area below). Charts are drawn at the panel's real
  size, so text stays readable; on short windows the rows keep a minimum height and the page
  scrolls. Hovering a continent outlines it in
  every chart instead of fading the others, so less changes at once. Thin columns and bands get a
  hover zone of at least 12–16 px; the Marimekko and area tooltips list the whole column or year,
  largest emitter first in the area. Chart texts were shortened to the value and what is needed to
  read it; the map's reading line says what the colour means for the chosen metric.
- **Play and sticky filters (review)**: the filter bar stays at the top while scrolling, so the
  year range is always at hand. In Year mode, a play button moves the year forward to 2024 (from 2000
  when already at the end), to follow progressions. The range modes have no play. Touching the slider or the mode stops it. This replaces the earlier decision not
  to build a play button.
- **Continent click and comparison (View A)**: one click on a continent in any chart (map,
  Marimekko column, emissions band or legend) opens the U7 pop-up with two explicit actions,
  *Explore countries →* and *+ Compare*, instead of separate gestures (double-click, shift-click)
  that users would not discover. Continents without a country level say so in the pop-up
  instead of the drill-down button. The comparison list can now hold continents as well as
  countries, 4 entries at most; it is shown as chips next to the breadcrumb, and each chip
  removes its entry. Compared entities get a thick outline and a ✓ in their label in every chart
  (hover keeps the thin outline). Continent chips use the continent colours of the emissions
  area; the colours of compared countries are chosen with View C (M4).
- **Focus on compared continents (View A)**: while the comparison list has entries, the other
  continents fade to 30% opacity in the Marimekko (source segments only; the columns share the
  0–100% baseline, so comparing them is not a problem) and return to full colour on hover. They
  are not removed, because T1 needs every continent.
  The map is not faded, because its colour is the metric scale,
  where a lighter colour would read as a lower value (and grey already means *no data*); there
  the thick outline and the ✓ mark the compared continents. If the tests show that this focus
  gets in the way of T1, add a *Highlight compared* on/off switch next to the chips.
- **Thin bands in the emissions area (review)**: Oceania and South America were hard to see and
  to click. Every band now has its name and 2024 value on the right, moved apart when they would
  overlap and joined to the band by a short leader line; the names are clickable like the bands.
  The band hover and click zones are at least 18 px tall (was 12 px).
- **Emissions chart with compared continents (review)**: in a stack only the bottom band starts
  at zero, so two compared continents could not be compared, and thin ones (Oceania, ~1% of the
  height) stayed thin. A y zoom does not help (thin bands sit at the top of the stack) and a
  "Rest of world" band keeps the same problems. So, while continents are in the comparison list,
  the chart shows one line per compared continent, each from zero, with the y axis fitted to
  them; the title names them ("… : Europe vs Oceania") and the reading line says how to get the
  world stack back (empty the list). The tooltip keeps the world total for context; the legend
  keeps all six continents, the others faded, so they can be added from there. With the list
  empty the stacked area is unchanged (T1). If the switch surprises users in the tests, use a
  *Stack / Compare* toggle on the panel instead.
- **Country map (View B)**: the map does not open a second chart. It changes level in the same
  panel: an azimuthal equal-area projection centred on the continent, fitted to a fixed box
  (Europe 24° W–42° E, 35–71° N; Asia 26–146° E, 10° S–54° N) and not to the countries' bounds,
  which Russia would stretch to the Pacific. The countries of other continents stay grey for
  context and are not clickable; the Map / Globe switch is hidden. The change is instant for now
  (animation in M6). Hover and compared outlines are drawn as separate paths on top, and compared
  countries are named on the visible part of their shape. Only the emissions panel is swapped for
  the View B panel. A compared country does not fade a chart of continents: a chart fades only
  when the list holds one of its own entities. Ukraine has no generation data from 2023 on (shown grey).
- **Country Marimekko (View B)**: the same chart, one column per country: the 10 largest by
  generation in the selected year, the compared countries outside them, and *Others* (the rest,
  summed; the same countries in every year of the range, so Range average and Change compare like
  with like). Clicking *Others*, or the *Show all N countries* button, shows every country; the
  button folds them back, and changing continent folds them again. The x axis is fixed to the
  continent's largest yearly total, so columns still grow over the years (U5). A country gets its
  own column only if it is at least 28 px wide at the current chart width (otherwise it folds into
  *Others*, unless compared): with a fixed top 10, Europe and Asia showed 4–5 unreadable slivers
  and the names overlapped. A wider screen shows more countries. Expanding does the inverse: the
  largest countries become one *Largest* column of fixed width (not to scale), the x axis breaks
  and starts again at 0, and every other country gets its own column, so the small ones open up
  instead of all 41 columns sharing the same scale. Only the tiniest (< 1% of the continent) stay
  slivers, named in the tooltip.
- **Magnified compared countries (Marimekko, View B)**: comparing a large country with a very
  small one (Germany ~500 TWh, Malta ~2 TWh) left the small one as an unreadable sliver. A compared
  country narrower than 28 px gets a magnified copy (34 px, not to scale) at the right end, after a
  second axis break, with its real TWh under it; its name moves to the copy and the tooltip says the
  width is not to scale. Only those countries get a copy, and only when needed, so the chart is
  unchanged otherwise. Rejected: a separate strip of 100% bars for every compared country (more
  clutter), equal widths (loses size, U5) and a log or square-root width (areas would lie).
- **Ranked top N (View B, instructor's tip, 11/2026)**: the instructor suggested making the
  country Marimekko filterable (top 10 by generation, by hydro, by nuclear, …) and breaking up its
  clutter. Measured on 2024: in a Marimekko the width is the total generation, so China (Asia) and
  Russia (Europe) take most of the axis, and 5–8 of a source's top 10 are under 28 px wide; fitting
  the axis to the top 10 only saves 1–2 of them. So the chart is *deconstructed*: a **Rank by**
  menu (total generation, low-carbon, fossil, or one source) and **Top 5 / Top 10 / All** above the
  chart. Top N shows the two dimensions of the Marimekko as two aligned charts: bars of the ranked
  value (TWh, scale fixed to the continent's largest value in any year, so growth stays visible,
  U5; value on each bar) and, under each bar, an equal-width column of the mix with the ranked
  sources at the base, so their shares sit on a common baseline; a dashed line gives the
  continent's share. Compared countries outside the top N follow after a gap; the tooltip gives
  the rank (*#5 in Europe by hydro generation*). *All* keeps the Marimekko (and its Others /
  Largest / magnified copies), now ordered by the chosen ranking with its sources at the base.
  Clicking a source in the legend ranks by it (again: back to total generation). Default: Top 10
  by total generation, so the continent opens on a readable chart. This revisits the rejection of
  equal widths below: the size is not lost, it moves to the bars. The World Marimekko is
  unchanged (six continents always fit). Rejected: a top N inside the Marimekko with magnified
  copies (~7 copies in Asia) or folding the thin ones (2–3 columns left in Asia).
- **Compared view, no map strip, 5 compared (View B, 11/2026)**: after the ranked top N, the team
  asked for three changes. (1) The strip of map colour above each Marimekko column (both levels)
  is removed: it repeated the map and added clutter; the map and the Marimekko are linked by
  hover and selection instead. (2) With two or more compared countries, a **Compared** button
  (first in *Top 5 / Top 10 / All*, disabled with fewer) shows only them in the bars + mix layout:
  bars of the ranked value (scale fixed to their largest value in any year) and normalised
  (equal-width, 100%) mix columns, ordered by *Rank by*. They can come from any continent; the
  tooltip gives the rank in their own continent, and the continent's dashed line is drawn only
  when all of them belong to the shown continent. Adding the second compared country switches to
  it; Top 5 / Top 10 / All go back to the whole continent. This revisits the rejected separate
  strip of 100% bars (magnified compared countries): it replaces the chart instead of adding one. (3) The comparison holds 5 instead of 4;
  the fifth country colour, `#0088ee`, was chosen with the dataviz validator over a colour grid:
  all-pairs worst CVD ΔE stays 10.7 and it is ΔE 11.8 from the nearest source colour.
- **Horizontal rows tried and reverted (View B, 11/2026)**: a layout with one row per country
  (name, bar of the ranked value, 100% mix bar with the ranked share written in it) was tried to
  stop names being cut, and reverted at the team's request: the vertical bars above mix columns
  stay. Not done (proposed): animated reordering when the ranking changes, and highlighting one
  source on legend hover.
- **Clear all (comparison list, 11/2026)**: with two or more entries, a *Clear all* link after
  the chips empties the list in one click (before, each chip had to be removed with its ×).
- **Country Marimekko removed, less text (View B, 11/2026)**: the *All* view (Marimekko of the
  continent's countries) still confused: in Asia China takes half the axis, only India and Japan
  get a readable column and *Others (47)* hides the rest; the title, two reading lines, the tools,
  a wrapped *Show all 50 countries* button and the legend left the chart ~150 px tall. Research
  (Marimekko guides: 6–7 columns at most, one dominant category squeezes the others; dataviz
  guide: more than 6 parts to compare → ranked bars) and the persona decide it: the instructor's
  tip was a suggestion, not a required chart, and no task of Carla's asks what slice of the
  continent each country is. Q2 (what a country's electricity is made of), T2 and T3 are served by
  the ranked bars + mix (*Top 5 / Top 10*), the *Compared* view, the map and the sorted bars, which
  show every country. So *All*, *Others* / *Largest*, the magnified copies, the axis breaks and the
  *Show all* button are removed; the Marimekko stays for the six continents (View A), where it
  works. Less text: one short reading line (details in the tooltips), shorter title (*Top 10 by
  hydro generation, Asia, 2024*), smaller tools and legend. Names of narrow columns (Top 10 in a
  narrow panel) are slanted instead of cut ("Germ…").
- **Bubble scatter (View B)**: one bubble per country of the continent in the selected year
  (x = emissions per person, log; y = carbon intensity; area = total emissions; colour = renewable
  share, the same ramp as the map). The axes and the bubble sizes are fixed per continent over
  2000–2024, so a moving bubble means a change. The World's values are dashed lines that split
  the plot in four, each corner labelled ("Cleaner than the World", "More polluting than the
  World", "Carbon-heavy grid, low use per person", "Clean grid, high use per person"); the tooltip
  says on which side of each World line the country is. Named: the 5
  largest emitters, the compared and the hovered countries, skipping names that would overlap.
  Compared countries are outlined, not faded (the fill is a sequential value); in Range average
  and Change their path since the range start is drawn. Hover picks the nearest bubble, so small
  bubbles under large ones can be reached.
- **Sorted bars (View B)**: change in renewable share (pp) of each country of the continent from
  the range start to the selected year, sorted from the largest gain, one row per country. In the
  Year mode the start is the last range start (2000 by default; the title gives the years), and a
  note asks for a later year when the year is not after it. Colour = the map's Change scale (blue
  = more renewable); the World's change is a dashed line. Names sit on the other side of the zero
  line, which stays at least 40% in from the unused side; with ~45 rows only the hovered,
  compared, brushed and the 3 largest gains and losses are named (all of them when rows are 11 px
  or taller); each row is a full-width hover and click zone. The bars sit next to the scatter in
  the same tab (*Emissions & change*), so the brush shows in both.
- **Brush (View B)**: a 2D brush on the bubble scatter selects a group. It is stored as a region
  in data units (per continent), so when the year changes the countries inside it are those whose
  bubbles are in the box that year; another continent ignores it. The group is highlighted in
  every View B chart: the other bubbles and bars fade, the Marimekko fades the other columns
  (*Others* stays if one of its countries is in the group), and the map outlines the group with
  dashes instead of fading (a lighter colour would mean a lower value). Dragging updates the other
  charts only when the group changes. A click without dragging clears the brush (and still opens
  the pop-up on a bubble). The group is not added to the comparison list (limit of 5).
- **View B panel height**: at the country level the bottom row gets more room (the scatter and
  the radar need height). The charts in the tabs fit the panel instead of setting its height, so
  switching tabs never resizes the rows above.
- **Country profiles (View C, built early)**: the radar belongs to View C (task T4, *Compare*),
  but until that screen exists it is a tab (*Emissions & change* / *Country profiles*) of the View B panel,
  so the page still fills the window. It moves to View C with M4. The legend sits beside the radar
  and the outer ring is the largest share shown (rounded up to 20%, at least 40%), so the shapes
  are not squeezed into the centre; every axis keeps the same scale. Markers are 8 px with a 20 px
  hover zone and use the shared tooltip; hovering a country in any chart thickens its shape and
  fades the other countries (not the World).
- **Comparison type**: the list holds continents or countries, not both, because no chart
  compares a continent with a country; adding the other type replaces the list, and the pop-up
  says so.
- **Colours of compared countries**: 4 fixed colours (violet, crimson, teal, olive), validated
  for colour blindness on all pairs (worst CVD ΔE 10.7) and away from the source colours (the first
  colour used to be the hydro blue). A country keeps its colour while it stays in the list, so
  removing one never repaints the others; a new country takes the first free colour.
