# 2nd Iteration: Heuristic Evaluation

> Covers: "The prototype must be tested through a Heuristic Evaluation."
> This evaluation judges the **quality of the visualisation**; the user tests with SUS
> ([03-user-testing.md](03-user-testing.md)) judge the perceived usability.

## Method

- **Heuristics**: Forsell & Johansson (2010), *An heuristic set for evaluation in information
  visualization* (AVI '10): 10 heuristics chosen from five earlier sets for their coverage of
  InfoVis problems. The letter is the source set (B: Freitas et al., C: Nielsen, D: Zuk &
  Carpendale, E: Bastien & Scapin).
- **Evaluators**: the two authors, Paulo Cunha (E1) and Tomás Gameiro (E2). Each one inspects
  the app **alone first**, without discussing, then the two lists are merged and each severity
  is agreed. Authors know the design, so this is a weaker evaluation than one with outside
  experts; the user tests compensate.
- **Procedure** per evaluator (~45 min):
  1. Free pass through View A → B → C to learn the flow.
  2. A second pass running tasks T1-T6
     ([../iteration1/01-data-analysis.md §3](../iteration1/01-data-analysis.md#3-target-user)),
     noting every problem with the heuristic it breaks, the screen and a screenshot.
- **Severity** (Nielsen): 0 not a problem · 1 cosmetic · 2 minor · 3 major (fix before
  delivery) · 4 catastrophic (must fix).
- **App version evaluated**: commit `ca4ac1d` (`ca4ac1deb5e2823b31396d7f093a7e0b86171ca8`), the same for both evaluators.

## The heuristics

| # | Heuristic | What to check in Green Paradox |
|---|---|---|
| H1 | **B5 Information coding**: data are mapped to visual elements in a way that is perceived correctly | Colour scales (blue ↔ red change, sequential shares), Marimekko widths, bubble areas, legends and units |
| H2 | **E7 Minimal actions**: few actions to reach a goal | Clicks to drill down, to compare, to open View C, to reach a country of another continent |
| H3 | **E11 Flexibility**: more than one way to reach a goal; adaptable to the user | Pop-up vs chips vs breadcrumb; sort ↓/↑; Year / Range average / Change; Rank by; Top 5/10 |
| H4 | **B7 Orientation and help**: control of detail, undo, extra information | Breadcrumb, tooltips, reading lines, undo of brush / comparison, "no data" states |
| H5 | **B3 Spatial organisation**: layout, legibility, use of space, no distortion | Three-panel grid, label overlap, thin bands and slivers, map projections, small screens |
| H6 | **E16 Consistency**: same choices in similar contexts | Same colours for sources/continents/compared countries everywhere, same terms, same scales |
| H7 | **C6 Recognition rather than recall**: no need to remember information between screens | Selected year/range always visible, compared list visible, View C labels |
| H8 | **E1 Prompting**: the user knows which actions are possible | Is clicking, brushing, *Compare →*, *Reference* discoverable? Disabled states explained? |
| H9 | **D10 Remove the extraneous**: nothing distracts from the essential | Amount of text, gridlines, decoration, repeated legends |
| H10 | **B9 Data set reduction**: filtering and reducing the data is easy and efficient | Continent drill-down, Top N, brush, comparison list, year range |

## Findings

One row per problem. *Found by*: E1, E2 or both (problems found by both are usually the most
important).

| # | Heuristic | Screen | Problem | Found by | Severity (0-4) | Fix |
|---|---|---|---|---|---|---|
| 1 | H1 B5 Information coding | World: map (*Change*, carbon intensity) | *Change* shows the absolute difference (g/kWh), so the map points to Oceania (−210 g/kWh, 2000→2024) as the largest cut, while in relative terms it is Europe (−36%). T1's answer depends on which reading the user assumes | E1 | 2 | |
| 2 | H1 B5 Information coding | World: map vs emissions area | The map draws the eye more than the emissions chart, so "which continent emits the most" can be answered from carbon intensity (the wrong metric). Asia is right only by coincidence, and Asia (573 g/kWh) vs Africa (544) is hard to tell apart on the 0-800 orange ramp | E1 | 3 | |
| 3 | H1 B5 Information coding | Continent: bubble scatter (T4) | T4 asks for countries that "use a lot of electricity per person", but x is *emissions* per person and no axis shows use (kWh/person). The evaluator could not tell what to look for. May also be a wording problem of T4 | E1 | 3 | |
| 4 | H5 B3 Spatial organisation | Continent: bubble scatter (Asia, 2024) | Centre overcrowded: the China and India bubbles cover dozens of small bubbles around 1-5 t/person and 500-700 g/kWh, many of them unlabelled | E1 | 3 | |
| 5 | H8 E1 Prompting | Continent: bubble scatter | "Drag to select a group" is buried mid-subtitle; it was not clear that T4 is solved with a brush | E1 | 2 | |
| 6 | H5 B3 Spatial organisation | Continent: bubble scatter (Europe, 2024, brushed) | Labels overlap inside the brush box: "Bosnia and Herzegovina" runs over the Poland bubble, "Russia" is covered by its own bubble, and the box covers the quadrant label and "World" | E1 | 2 | |
| 7 | H1 B5 Information coding | Compare: radars (T5) | The radars answer "which is cleanest" only after careful observation: there is no summary number (g/kWh or % fossil), so the coal, oil and gas axes must be added up mentally | E1 | 2 | |
| 8 | H5 B3 Spatial organisation | Compare: radars (Portugal, Spain, France, 2024) | The shared 0-80% scale is set by France's nuclear, so the Portugal and Spain polygons are squeezed into the 0-20% zone, close to the dashed Europe reference, and hard to compare | E1 | 2 | |
| 9 | H5 B3 Spatial organisation | Compare: radars vs rows | Hovering a row redraws the radars for that year, but the radars are at the top and the rows below, off screen, so the link is lost: both are never visible at once | E1 | 2 | |
| 10 | H6 E16 Consistency | Compare: rows, "Why did CO₂e change?" (T6) | Orange means "More or less electricity" in this column, but Gas in the mix column of the same row: one colour, two meanings side by side | E1 | 2 | |
| 11 | H1 B5 Information coding | Continent: sorted bars, CO₂e column | Gibraltar shows "▲ 0%": an up arrow for no change is misleading (should be "0%" with no arrow) | E1 | 1 | |
| 12 | | | | | | |

## Summary per heuristic

| Heuristic | Problems | Worst severity |
|---|---|---|
| H1 B5 Information coding | | |
| H2 E7 Minimal actions | | |
| H3 E11 Flexibility | | |
| H4 B7 Orientation and help | | |
| H5 B3 Spatial organisation | | |
| H6 E16 Consistency | | |
| H7 C6 Recognition rather than recall | | |
| H8 E1 Prompting | | |
| H9 D10 Remove the extraneous | | |
| H10 B9 Data set reduction | | |

## Fixes applied

Severity 3-4 are fixed before the user tests; 1-2 if time allows, otherwise listed as future
work. Each fix gets a line in the decision log of
[01-integration-plan.md](01-integration-plan.md).
