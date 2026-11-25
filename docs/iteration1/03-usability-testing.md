# 1st Iteration: Usability Testing (Paper Prototype)

> Brief: "Usability testing of the prototype with users (can be done in class with classmates).
> Do not forget to define the most important tasks that should be tested with users."
> Done in class on **26/10**.
>
> **Iteration-1 record.** The current design is in [../iteration2/01-integration-plan.md](../iteration2/01-integration-plan.md).

## Prototype and participants

Paper prototype, one sheet per view, interactions simulated by hand
([`../../prototype/paper-sketches/`](../../prototype/paper-sketches)). Five classmates from the
course took part.

## Method

Think-aloud in two phases: free exploration without help, then the tasks below. Each
participant ended with free feedback.

## Tasks tested

1. Pick Selection Mode
2. Select Portugal on the global map
3. Identify Portugal's main source of energy in 2020 and in 2024
4. In what year does solar become noticeable in the chart?
5. Did production in Portugal rise or stagnate between 2000 and 2024?
6. Relative to demand, is Portugal's production green?
7. Pick Comparison Mode
8. Pick Portugal, Denmark and Spain for comparison
9. Which of the three pollutes the most?
10. Is the biggest total emitter also the biggest emitter per person?
11. Which of the three has the most green energy in its production?
12. Which has the most "balanced" profile?

### Linked task: "greener, but not cleaner?" over one decade

1. **Map:** Change mode, range 2014-2024; select a country whose renewable share grew most.
2. **Electricity over time:** which source made it greener? Did the columns get wider?
3. **Emissions:** in 2024, is it above or below the World line for emissions per person?
4. **Green Growth** (from 2014): did new low-carbon generation cover new demand? Was the
   emissions change driven more by demand or by the mix?
5. **Country profiles:** against the World shape, on which axis does it stand out most?
6. **Conclusion:** "greener, but not cleaner", or both?

*Success:* finds a country with a large gain, names the source, reads the area colour and the
larger effect correctly, and concludes consistently. It tests the Change mode, Marimekko widths,
the scatter's World lines, the difference chart and decomposition, the radar reference, and
whether participants combine views. Expected time 3-5 minutes; steps 3 and 5 drop first.

## Results

| Participant | Feedback |
|---|---|
| P1 | Add units to the country profiles. Label the net-change line in the Green Growth emissions panel. |
| P2 | Label the areas of the demand / low-carbon panel. Make the Energy view units more visible. |
| P3 | The menus were confusing (partly because of the paper format). |
| P4 | Add a TWh mode to the Energy view; growth is hard to see in % only. |
| P5 | Add units to the radar. Drop the Selection / Comparison modes; use a pop-up to decide whether to compare. |

Main findings:

- **Missing units and labels** were the most frequent problem (P1, P2, P5).
- **Navigation:** separate Selection and Comparison modes confused (P3, P5).
- **Energy view:** growth hard to see in % only (P4).

Changes: table *Feedback from the iteration-1 usability tests* in
[`../iteration2/01-integration-plan.md`](../iteration2/01-integration-plan.md).
