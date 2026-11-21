# 2nd Iteration — Heuristic Evaluation

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
  2. A second pass running tasks T1–T6
     ([../iteration1/01-data-analysis.md §3](../iteration1/01-data-analysis.md#3-target-user)),
     noting every problem with the heuristic it breaks, the screen and a screenshot.
- **Severity** (Nielsen): 0 not a problem · 1 cosmetic · 2 minor · 3 major (fix before
  delivery) · 4 catastrophic (must fix).
- **App version evaluated**: commit `________` (fill in).

## The heuristics

| # | Heuristic | What to check in Green Paradox |
|---|---|---|
| H1 | **B5 Information coding** — data are mapped to visual elements in a way that is perceived correctly | Colour scales (blue ↔ red change, sequential shares), Marimekko widths, bubble areas, legends and units |
| H2 | **E7 Minimal actions** — few actions to reach a goal | Clicks to drill down, to compare, to open View C, to reach a country of another continent |
| H3 | **E11 Flexibility** — more than one way to reach a goal; adaptable to the user | Pop-up vs chips vs breadcrumb; sort ↓/↑; Year / Range average / Change; Rank by; Top 5/10 |
| H4 | **B7 Orientation and help** — control of detail, undo, extra information | Breadcrumb, tooltips, reading lines, undo of brush / comparison, "no data" states |
| H5 | **B3 Spatial organisation** — layout, legibility, use of space, no distortion | Three-panel grid, label overlap, thin bands and slivers, map projections, small screens |
| H6 | **E16 Consistency** — same choices in similar contexts | Same colours for sources/continents/compared countries everywhere, same terms, same scales |
| H7 | **C6 Recognition rather than recall** — no need to remember information between screens | Selected year/range always visible, compared list visible, View C labels |
| H8 | **E1 Prompting** — the user knows which actions are possible | Is clicking, brushing, *Compare →*, *Reference* discoverable? Disabled states explained? |
| H9 | **D10 Remove the extraneous** — nothing distracts from the essential | Amount of text, gridlines, decoration, repeated legends |
| H10 | **B9 Data set reduction** — filtering and reducing the data is easy and efficient | Continent drill-down, Top N, brush, comparison list, year range |

## Findings

One row per problem. *Found by*: E1, E2 or both (problems found by both are usually the most
important).

| # | Heuristic | Screen | Problem | Found by | Severity (0–4) | Fix |
|---|---|---|---|---|---|---|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |

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

Severity 3–4 are fixed before the user tests; 1–2 if time allows, otherwise listed as future
work. Each fix gets a line in the decision log of
[01-integration-plan.md](01-integration-plan.md).
