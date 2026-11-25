# 2nd Iteration: User Testing (Final Application)

> Brief: "tested ... again with users as representative as possible of the target users."
> Method (course slides, *Evaluation in Visualization*): task-based test with think-aloud, then
> the **System Usability Scale (SUS)** for perceived usability. The visualisation's quality is
> judged with Forsell's heuristics in [02-heuristic-evaluation.md](02-heuristic-evaluation.md).

## Participants

- **3 to 5 classmates** (UA, Information Visualisation), in class. With n ≤ 5 the SUS score is
  only indicative: report individual scores and the mean, no confidence claims.
- They read charts daily but most do not know the energy domain, unlike Carla. A short briefing
  (see *Script*) gives them her assignment and the units, so the test measures the interface.
- Prefer people who did not see the iteration-1 paper test; record it when they did.

| ID | Course / year | Saw iteration 1? | Reads charts often? (1-5) |
|---|---|---|---|
| P1 | | | |
| P2 | | | |
| P3 | | | |
| P4 (optional) | | | |
| P5 (optional) | | | |

## Roles and setup

- **Facilitator**: reads the script and tasks; helps only if the participant is stuck for over
  2 minutes (the task then counts as *failed*).
- **Observer**: times each task, notes errors and think-aloud quotes.
- Laptop, app on the World screen, year 2024, empty comparison list, full-screen window.
  Reload between participants.
- About 15 minutes each: 1 min briefing, 10 min tasks, 2 min SUS, 2 min questions.

## Script (read to the participant)

> "You are Carla, an analyst at a public energy agency. You are preparing a briefing for the
> board: *Has the growth of renewables actually reduced emissions from electricity? Where has it,
> where has it not, and why?* TWh measures how much electricity was generated; gCO₂e/kWh is how
> much CO₂e each unit of electricity emits. We are testing the application, not you. Please say
> aloud what you are looking at and what you are trying to do."

## Tasks

The tasks of [../iteration1/01-data-analysis.md §3](../iteration1/01-data-analysis.md#3-target-user).
Each uses a different chart, so every view is covered. Check the expected answers in the app
version under test before the session.

| # | Task (as read) | Type | Main chart | Expected answer |
|---|---|---|---|---|
| T1 | Which continent emits the most CO₂e from electricity in 2024, and which one cut the CO₂e per unit of electricity the most since 2000? | Find extremum | Emissions area; map (*Carbon intensity*, *Change*) | Asia (about 10.3 GtCO₂e); Oceania (about 705 to 495 gCO₂e/kWh), then North America and Europe |
| T2 | What does Asia make most of its electricity from in 2024? And Europe? | Composition | Marimekko (World) | Asia: coal (about half). Europe: a mix, gas about 24%, nuclear 20%, hydro 17%, none above a quarter |
| T3 | In Asia, among the countries that gained the most renewables since 2014, find one whose CO₂e still went up. | Find exception | Sorted bars + CO₂e column | e.g. Turkey (+24.7 pp, CO₂e +12%), Jordan, China (+11.4 pp, CO₂e +39%) |
| T4 | In Europe, select the countries with dirty electricity that use a lot of it per person. Name two. | Group (brush) | Bubble scatter + brush | Upper-right corner: Kosovo, Serbia, Bosnia and Herzegovina, Poland, Cyprus, Malta |
| T5 | In Europe, put three countries side by side. Which has the cleanest electricity, and is it cleaner than Europe as a whole? | Compare | Comparison list; radar, *Reference: Europe* | Depends on the choice: the largest low-carbon shape; cleaner than Europe if it goes beyond the dashed shape on those axes |
| T6 | For one of them: did its CO₂e change mostly because it made more electricity, or because it changed how it makes it? | Explain | Compare: "Why emissions changed" | Depends on the choice |

Per task: success (✓ done / ~ with help / ✗ failed), time (s), errors (wrong click, chart or
answer), think-aloud notes.

## SUS questionnaire

On paper or a Google Form right after the last task, before any discussion. Standard wording
(Brooke, 1996) with "application" for "system"; 5-point scale (1 = strongly disagree, 5 =
strongly agree); every item answered (tick 3 if unsure). English is the reference.

| # | Statement | Em português |
|---|---|---|
| 1 | I think that I would like to use this application frequently. | Acho que gostaria de usar esta aplicação com frequência. |
| 2 | I found the application unnecessarily complex. | Achei a aplicação desnecessariamente complexa. |
| 3 | I thought the application was easy to use. | Achei a aplicação fácil de usar. |
| 4 | I think that I would need the support of a technical person to be able to use this application. | Acho que precisaria do apoio de um técnico para conseguir usar esta aplicação. |
| 5 | I found the various functions in this application were well integrated. | Achei as várias funcionalidades desta aplicação bem integradas. |
| 6 | I thought there was too much inconsistency in this application. | Achei que havia demasiada inconsistência nesta aplicação. |
| 7 | I would imagine that most people would learn to use this application very quickly. | Imagino que a maioria das pessoas aprenderia a usar esta aplicação muito rapidamente. |
| 8 | I found the application very cumbersome to use. | Achei a aplicação muito complicada/pesada de usar. |
| 9 | I felt very confident using the application. | Senti-me muito confiante a usar a aplicação. |
| 10 | I needed to learn a lot of things before I could get going with this application. | Precisei de aprender muitas coisas antes de conseguir começar a usar esta aplicação. |

Two open questions (not scored): what was most useful for Carla's briefing? What confused you most?

### Scoring

Odd items: score - 1. Even items: 5 - score. SUS = sum × 2.5, from 0 to 100 (not a
percentage). **68 is the average**; 80 or more is good; below 50 signals serious problems.
Report per-item means too: a low item (e.g. 6 or 10) points to what to fix.

Spreadsheet, answers in B-K: `=2.5*((B2-1)+(5-C2)+(D2-1)+(5-E2)+(F2-1)+(5-G2)+(H2-1)+(5-I2)+(J2-1)+(5-K2))`

## Results

### Tasks

| Task | P1 | P2 | P3 | P4 | P5 | Success | Median time |
|---|---|---|---|---|---|---|---|
| T1 | | | | | | /5 | |
| T2 | | | | | | /5 | |
| T3 | | | | | | /5 | |
| T4 | | | | | | /5 | |
| T5 | | | | | | /5 | |
| T6 | | | | | | /5 | |

### SUS

| Item | P1 | P2 | P3 | P4 | P5 | Mean |
|---|---|---|---|---|---|---|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |
| 5 | | | | | | |
| 6 | | | | | | |
| 7 | | | | | | |
| 8 | | | | | | |
| 9 | | | | | | |
| 10 | | | | | | |
| **SUS score** | | | | | | |

### Problems found

| # | Problem (task, participant) | Severity (0-4) | Change made / planned |
|---|---|---|---|
| | | | |

## Comparison with iteration 1

> TODO after the session: which of U1-U7 no longer appeared, what is still an issue, what is
> out of scope. The paper test had no SUS, so the comparison is qualitative.
