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
- **Review status**: E1 and E2's findings and severity ratings are recorded;
  cross-evaluator consolidation and agreement are still pending.
- **App version evaluated**: commit `ca4ac1d` (`ca4ac1deb5e2823b31396d7f093a7e0b86171ca8`), the same for both evaluators.

## The heuristics

| # | Heuristic | What to check in Green Paradox |
|---|---|---|
| H1 | **B5 Information coding**: data are mapped to visual elements in a way that is perceived correctly | Colour scales (blue ↔ red change, sequential shares), Marimekko widths, bubble areas, legends and units |
| H2 | **E7 Minimal actions**: few actions to reach a goal | Clicks to drill down, to compare, to open View C, to reach a country of another continent |
| H3 | **E11 Flexibility**: more than one way to reach a goal; adaptable to the user | Pop-up vs chips vs breadcrumb; sort ↓/↑; Year / Change; Rank by; Top 5/10 |
| H4 | **B7 Orientation and help**: control of detail, undo, extra information | Breadcrumb, tooltips, reading lines, undo of brush / comparison, "no data" states |
| H5 | **B3 Spatial organisation**: layout, legibility, use of space, no distortion | Three-panel grid, label overlap, thin bands and slivers, map projections, small screens |
| H6 | **E16 Consistency**: same choices in similar contexts | Same colours for sources/continents/compared countries everywhere, same terms, same scales |
| H7 | **C6 Recognition rather than recall**: no need to remember information between screens | Selected year/range always visible, compared list visible, View C labels |
| H8 | **E1 Prompting**: the user knows which actions are possible | Is clicking, brushing, *Compare →*, *Reference* discoverable? Disabled states explained? |
| H9 | **D10 Remove the extraneous**: nothing distracts from the essential | Amount of text, gridlines, decoration, repeated legends |
| H10 | **B9 Data set reduction**: filtering and reducing the data is easy and efficient | Continent drill-down, Top N, brush, comparison list, year range |

## Findings

One row per reported problem. *Found by*: E1, E2 or both.

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
| 12 | H10 B9 Data set reduction | Continent: bubble scatter (Asia, brush + comparison) | Adding one country to the comparison switched the scatter to compared-only, which emptied the brushed group ("0 countries selected"), so a brush and a comparison could not be used together | E1 | 3 | Brush and comparison are independent: with both, the scatter and the sorted bars show the brushed group plus the compared countries |
| 13 | H1 B5 Information coding | Continent: sorted bars (Europe, Russia compared, brush) | A compared country outside the brush was faded like any other, so Russia's bar, arrow and name were near invisible | E1 | 2 | Compared and hovered countries are never faded by the brush, in every chart |
| 14 | H4 B7 Orientation and help | Continent: all charts (Europe, empty brush) | A brush box with no country inside still counted as a selection: every chart faded and the sorted bars were empty ("0 of 40 countries") | E1 | 2 | An empty brush counts as no brush; the box stays and fills again if the year brings countries into it |
| 15 | H5 B3 Spatial organisation | Continent: mix chart (Asia, Top 5, brush) | When the brushed countries were not in the Top N, all columns faded and the chart showed nothing of the group | E1 | 2 | Brushed countries outside the Top N follow on the right (up to 5, by the ranking), with a note for the rest |
| 16 | H5 B3 Spatial organisation | Continent: bubble scatter (narrow screen) | The two quadrant labels of a row overlapped ("Carbon-heavy grid, low use per person" over "More polluting than the World") | E1 | 1 | A row whose labels would overlap keeps only the bold one |
| 17 | H1 B5 Information coding | Continent: Change by compared countries | The bar colours are not explained by a legend or reading line. The meaning of the blue/red encoding of renewable-share change is not explicit. This finding concerns the bars, not only the CO₂e arrows. | E2 | 2 | Proposed: label blue as an increase and red as a decrease in renewable share, measured in percentage points. |
| 18 | H1 B5 Information coding | Compare: Why did CO₂e change? | The label “Different way of making it” does not identify the effect of changing the electricity mix or carbon intensity. Its meaning depends on prior knowledge of the decomposition. | E2 | 2 | Proposed: use “Electricity mix effect” and explain that it measures the emissions change associated with a change in carbon intensity. |
| 19 | H4 B7 Orientation and help | Continent: bubble scatter | The chart does not provide enough guidance to distinguish total emissions, emissions per person and carbon intensity when identifying more polluting countries. | E2 | 2 | — |
| 20 | H6 E16 Consistency | World/Continent: map and scatter; Compare: clean-growth chart | Green represents renewable share in the map and scatter, while blue represents low-carbon generation in the growth chart. The difference between renewables and low-carbon generation is not explicit enough to prevent interpreting these as the same measure with inconsistent colours. | E2 | 2 | Proposed: state “Low-carbon = renewables + nuclear” and distinguish share from generation growth in the labels. Retain the blue/red change encoding. |
| 21 | H8 E1 Prompting | Continent: entry to Compare view | The “Compare →” navigation button is difficult to notice, making the additional comparison charts difficult to discover. | E2 | 3 | Proposed: add a short action prompt next to the selected-country list explaining how to open Compare, with a “Don’t show again” option. |
| 22 | H8 E1 Prompting | World/Continent: Marimekko legend | Source labels in the legend are interactive, but their filtering action is not clearly signalled. Separate filter controls provide an alternative route. | E2 | 1 | — |

#12-16 were found in the free pass (step 1 of the procedure), not while running a task, so
they say nothing about how well T1-T6 are answered.

## Summary per heuristic

This is a summary of the **22 recorded findings**, before joint deduplication and severity
agreement: 16 from E1 and 6 from E2. Counts refer to reported findings, not necessarily distinct
problems across evaluator reports. The same totals are published in `data/sus-results.json`.

| Heuristic | Problems | Worst severity |
|---|---|---|
| H1 B5 Information coding | 8 | 3 |
| H2 E7 Minimal actions | 0 | — |
| H3 E11 Flexibility | 0 | — |
| H4 B7 Orientation and help | 2 | 2 |
| H5 B3 Spatial organisation | 6 | 3 |
| H6 E16 Consistency | 2 | 2 |
| H7 C6 Recognition rather than recall | 0 | — |
| H8 E1 Prompting | 3 | 3 |
| H9 D10 Remove the extraneous | 0 | — |
| H10 B9 Data set reduction | 1 | 3 |

Recorded severity distribution: **5 major (3), 14 minor (2), 3 cosmetic (1)**. No catastrophic
problems (4) were reported. H2, H3, H7 and H9 have no reported problems.

## Fixes applied

Severity 3-4 are fixed before the user tests; 1-2 if time allows, otherwise listed as future
work. Each fix gets a line in the decision log of
[01-integration-plan.md](01-integration-plan.md).

- **#12-16** (brush and comparison): fixed; decision log entry "Brush with a comparison".
