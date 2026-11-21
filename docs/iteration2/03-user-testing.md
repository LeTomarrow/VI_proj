# 2nd Iteration — User Testing (Final Application)

> Covers: "tested ... again with users as representative as possible of the target users."
> Method from the course slides (*Evaluation in Visualization*): task-based usability test with
> think-aloud, followed by the **System Usability Scale (SUS)**. SUS measures the
> **perceived usability** of the application; the quality of the visualisation itself is judged
> with Forsell's heuristics in [02-heuristic-evaluation.md](02-heuristic-evaluation.md).

## Participants

- **3 to 5 classmates** (UA, Information Visualisation), tested in class. A small formative
  test like this finds most of the serious problems; with n ≤ 5 the SUS score is only
  indicative and is reported as such (individual scores + mean, no confidence claims).
- How they match Carla (energy and environment analyst, reads charts daily, knows TWh and
  gCO₂/kWh, does not program): they read charts daily, but most do not know the energy domain.
  Before the session each participant gets a one-paragraph briefing with Carla's assignment and
  the units (see *Script*), so the test measures the interface, not energy knowledge.
- None of them took part in the iteration-1 paper test, if possible, so the app is new to them.
  Record it when that is not the case.

| ID | Course / year | Saw iteration 1? | Reads charts often? (1–5) |
|---|---|---|---|
| P1 | | | |
| P2 | | | |
| P3 | | | |
| P4 (optional) | | | |
| P5 (optional) | | | |

## Roles and setup

- **Facilitator** (one student): reads the script and the tasks, does not help unless the
  participant is stuck for more than 2 minutes (then the task counts as *failed*).
- **Observer** (the other student): times each task, writes errors and think-aloud quotes.
- Laptop with the app open on the World screen, year 2024, empty comparison list, browser
  window at full screen. Reset (reload) between participants.
- About 15 minutes per participant: 1 min briefing, ~10 min tasks, 2 min SUS, 2 min questions.

## Script (read to the participant)

> "You are Carla, an analyst at a public energy agency. You are preparing a briefing for the
> board: *Has the growth of renewables actually reduced emissions from electricity? Where has it,
> where has it not, and why?* TWh measures how much electricity was generated; gCO₂/kWh is how
> much CO₂ each unit of electricity emits. We are testing the application, not you. Please say
> aloud what you are looking at and what you are trying to do."

## Tasks tested

The tasks of [../iteration1/01-data-analysis.md §3](../iteration1/01-data-analysis.md#3-target-user),
worded for someone with no energy background. Each one asks a different kind of question with a
different chart, so the test covers every view. Expected answers come from the OWID data for 2024 (or the years named); check them in the
app version under test before the session.

| # | Task (as read to the participant) | Task type | Main chart | Expected answer |
|---|---|---|---|---|
| T1 | Which continent emits the most CO₂ from electricity in 2024, and which one cut the CO₂ per unit of electricity the most since 2000? | Find extremum (overview) | Emissions area · map (*Carbon intensity*, *Change*) | Asia (≈10.3 GtCO₂e); Oceania (≈705 → 495 gCO₂/kWh), North America and Europe next |
| T2 | What does Asia make most of its electricity from in 2024? And Europe? | Composition | Marimekko (World) | Asia: coal (about half). Europe: a mix, gas ≈ 24%, nuclear ≈ 20%, hydro ≈ 17%, no source above a quarter |
| T3 | In Asia, among the countries that gained the most renewables since 2014, find one whose CO₂ still went up. | Find exception | Sorted bars + CO₂ column | e.g. Turkey (+24.7 pp, CO₂ +12%), Jordan, China (+11.4 pp, CO₂ +39%) |
| T4 | In Europe, select the countries with dirty electricity that use a lot of it per person. Name two. | Group (brush) | Bubble scatter + brush | Upper-right corner (more polluting than the World): Kosovo, Serbia, Bosnia and Herzegovina, Poland, Cyprus, Malta |
| T5 | Put two European countries and one Asian country side by side. Which has the cleanest electricity? | Compare | Search, comparison list, Compare: radar | Depends on the choice |
| T6 | For one of them: did its CO₂ change mostly because it made more electricity, or because it changed how it makes it? | Explain (details on demand) | Compare: "Why emissions changed" | Depends on the choice |

Measures per task: success (✓ completed / ~ with help / ✗ failed), time (s), number of errors
(wrong click, wrong chart, wrong answer), and think-aloud notes.

## SUS questionnaire

Given on paper or in a Google Form right after the last task, before any discussion. Standard
SUS wording (Brooke, 1996), "system" replaced by "application"; answers on a 5-point scale
(1 = strongly disagree … 5 = strongly agree). Every item must be answered; if unsure, tick 3.
The Portuguese wording is for participants who prefer it; the English one is the reference.

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

Then two open questions (not part of the score):

1. What was the most useful thing in the application for Carla's briefing?
2. What confused you the most?

### Scoring

For each participant:

- odd items (positive): score − 1
- even items (negative): 5 − score
- SUS = (sum of the 10 contributions) × 2.5 → a value from 0 to 100

Reading the score: **68 is the average** of published SUS studies; above 68 is above average,
around 80 or more is good, below 50 signals serious usability problems. The score is not a
percentage. Report the per-item means too: a low item (e.g. 6 *inconsistency* or 10 *learn a
lot*) points to the part of the interface to fix.

Spreadsheet formula, answers in columns B–K of one row:
`=2.5*((B2-1)+(5-C2)+(D2-1)+(5-E2)+(F2-1)+(5-G2)+(H2-1)+(5-I2)+(J2-1)+(5-K2))`

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

| # | Problem (task, participant) | Severity (0–4) | Change made / planned |
|---|---|---|---|
| | | | |

## Comparison with iteration-1 results

> TODO after the session: which of U1–U7 (iteration 1) no longer appeared, what is still an
> issue, and what is out of scope for this delivery. The paper test had no SUS, so the
> comparison is qualitative (problems and task success), not of scores.
