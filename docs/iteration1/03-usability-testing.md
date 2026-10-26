# 1st Iteration — Usability Testing (Low-Fidelity Prototype)

> Covers: "Usability testing of the prototype with users (can be done in class with
> classmates). Do not forget to define the most important tasks that should be tested with
> users." Presented in class on **26/10** (second half of class).

## Prototype

Paper prototype, one sheet per view, with interactions simulated by hand. The sketches are in
[`../../prototype/paper-sketches/`](../../prototype/paper-sketches).

## Tasks tested

> 1. Pick Selection Mode
> 2. Select Portugal in the global Map
> 3. Identify the main source of energy for Portugal in 2020 and in 2024
> 4. In what year does Solar become noticeable in the chart
> 5. Did production in Portugal rise or stagnate between 2000 and 2024
> 6. Related to demand determine if Portugal's energy production is green
> 7. Pick Comparison Mode
> 8. Pick Portugal, Denmark and Spain for comparison
> 9. Determine between the three which is more pollutant
> 10. Is the biggest total emitter also the biggest emitter per capita
> 11. Determine which of the three countries has the most green energy in it's production
> 12. Who has the most "balanced" profile

## Linked Tasks

**"Greener, but not cleaner?" over one decade.** You want to know whether a country that
became greener in the last decade also became cleaner.

1. **Global Map:** switch to **Change** mode, set the range to **2014–2024**, and select one of
   the countries whose renewable share grew the most (the darkest green, as opposed to the
   almost white countries that barely changed).
2. **Electricity over time:** which source grew the most and made this country greener? Did the
   columns get wider, that is, did generation grow?
3. **Emissions:** in 2024, is the country above or below the World's line for emissions per
   capita?
4. **Green Growth** (now starting in 2014): did new low-carbon generation cover the growth in
   demand? Did emissions fall, and was the change driven more by demand or by the mix?
5. **Country Profiles:** compared with the World's shape (in grey), on which axis does the
   country stand out the most?
6. **Conclusion:** did this country become "greener, but not cleaner", or both?

*Success:* the participant finds a country with a large increase, names the source that grew,
says correctly whether the area between the curves is green or red and which effect (demand
or mix) is larger, and gives a conclusion consistent with these answers.

*What it tests:*
1. the Change mode, the diverging scale and country selection;
2. whether the width of the Marimekko columns is read as generation;
3. reading the scatter and the World's reference lines;
4. the difference chart and the decomposition, and the link between the range slider and the
   start year of Green Growth;
5. reading the radar and its reference shape;
6. whether the participant combines the views into one answer.

Expected time: 3 to 5 minutes. If time is short, steps 3 and 5 are the first to drop.

## Participants

Five classmates from the Information Visualisation course, tested in class on 26/10.

## Method

**Think-aloud**, in two phases:

1. **Free exploration.** Participants explored the prototype on their own, without help, and
   said aloud what they saw, what they expected each control to do and what confused them.
2. **Tasks.** We then asked them to do the simple tasks listed in *Tasks tested*, still
   thinking aloud.

At the end each participant gave free feedback.

## Results & findings

Feedback per participant:

| Participant | Feedback |
|---|---|
| P1 | Add units to the country profile view. Add a label for the overall (net change) line in the emissions panel of Green Growth. |
| P2 | Add labels for the areas in the demand / low-carbon panel of Green Growth. Make the units at the bottom of the Energy view more noticeable. |
| P3 | The menus were confusing (partly because of the paper format). |
| P4 | Add a TWh mode to the Energy view, instead of percentages only, to make growth easier to notice. |
| P5 | Add units to the radar chart. Drop the separate Selection and Comparison modes and use a pop-up to decide whether to compare a country. |

Main findings:

- **Missing units and labels** were the most frequent problem (P1, P2, P5): radar axes, the
  areas of the difference chart, the net-change line of the decomposition, and the units of
  the Energy view.
- **Navigation:** the split into a Selection mode and a Comparison mode was confusing (P3, P5).
- **Energy view:** growth in generation was hard to notice with shares in % only (P4).

## Changes planned for iteration 2

See [`../iteration2/01-integration-plan.md`](../iteration2/01-integration-plan.md) (table
*Feedback from the iteration-1 usability tests*).
