# 1st Iteration: Data, Phenomenon, Users and Questions

> Brief: "Analysis of the data and the phenomenon they represent, of users, context of use and
> main questions that the application should help to answer."

**App:** Green Paradox. *Greener, but not cleaner? The global electricity transition, 1985-2025.*

## 1. The data

- **Source:** Our World in Data, Energy dataset, https://github.com/owid/energy-data, compiled
  mainly from Ember and the Energy Institute *Statistical Review of World Energy* (all three
  credited in the app).
- **Licence:** CC BY 4.0 (free reuse with credit).
- **Citation:** Hannah Ritchie, Pablo Rosado and Max Roser (2023), "Energy", OurWorldinData.org.
- **File:** `data/owid-energy-data.csv`, 23,377 rows (country or region × year, 1900-2025) ×
  130 columns, annual values.

### 1.1 Scope: electricity

| Family | Columns | Countries with data | Years |
|---|---|---|---|
| Primary energy (all uses) | `*_consumption`, `*_share_energy` | 79 (by source) | 1965-2024 |
| Electricity | `*_electricity`, `*_share_elec` | about 210 | 1985-2025 |

The app uses **electricity** only: it is the one family with a per-source breakdown for almost
every country, and it has its own emissions variables. Mixing families would make countries
incomparable (Portugal, 2023: electricity 74% renewable, total energy 35%). Primary energy,
production, pre-computed change columns, `gdp` and `energy_per_gdp` (end in 2022) are not used.

### 1.2 Variables used (16 of 130)

| Group | Variables | Unit |
|---|---|---|
| Identification | `country`, `year`, `iso_code` | |
| Normalisation | `population` | people |
| Electricity mix | `coal_electricity`, `oil_electricity`, `gas_electricity`, `nuclear_electricity`, `hydro_electricity`, `solar_electricity`, `wind_electricity`, `biofuel_electricity`, `other_renewable_exc_biofuel_electricity` | TWh |
| Total | `electricity_generation` | TWh |
| Emissions | `greenhouse_gas_emissions` (from electricity) | MtCO₂e |
| Emissions | `carbon_intensity_elec` | gCO₂e/kWh |

Other renewables come from `other_renewable_exc_biofuel_electricity`, because
`other_renewable_electricity` already includes bioenergy.

**Derived in the app** (computed the same way everywhere):

- each source's share (%), and three groups: fossil (coal, oil, gas), renewable (hydro, solar,
  wind, bioenergy, other) and low-carbon (renewable + nuclear);
- per-person values (÷ `population`);
- averages over a range of years and changes between two years;
- continent totals (1.3).

Per-view calculations (decomposition, radar scales) are in
[02-visualization-choices.md](02-visualization-choices.md).

### 1.3 Preprocessing

- Aggregate rows (`iso_code` empty or `OWID_*`) are removed, except `World` (reference line).
- Years limited to **1985-2025**.
- If `electricity_generation` exists but a source is empty, the source is **0**. Checked on all
  808 such rows in 2000-2024: the other sources always add up to the total.
- Result: 6,603 rows, 215 countries (214 with an ISO code, plus Kosovo).
- **Continents:** OWID's mapping, `data/owid-continents.csv` (countries with data in 2024:
  Africa 51, Asia 50, Europe 41 with Kosovo, North America 29, Oceania 14, South America 12).
  Continent totals sum their countries' TWh and MtCO₂e; shares and carbon intensity are
  recomputed from the sums, never averaged. For 2000-2024 the sums match OWID's continent rows
  within 1%; the app checks this on load.
- **Map join:** the map uses numeric ISO codes (`716`), OWID three-letter codes (`ZWE`). A
  one-off script with `i18n-iso-countries` writes `data/iso-numeric.json`; all 236 map polygons
  with an id are converted. Kosovo is keyed as `OWID_KOS`. Somaliland and N. Cyprus are drawn
  as part of Somalia and Cyprus (as OWID counts them). Antarctica and a few territories belong
  to no continent and stay neutral. French Guiana, Guadeloupe, Martinique and Réunion take
  France's colour; Gibraltar has no polygon. All of them still count in their continent.

### 1.4 Coverage and gaps

| Years | Countries with electricity mix | Carbon intensity | Emissions |
|---|---|---|---|
| 1985-1989 | 76 | none | none |
| 1990-1999 | 81 | 33 | none |
| 2000-2024 | about 196-211 | about 195-210 | about 196-211 |
| 2025 | 90 (all major producers) | 90 | 90 |

Display rules:

- Countries without data for the year are grey, labelled "no data".
- A coverage indicator by the slider ("Data available: 81 / 214 countries") keeps users from
  reading the jump in 2000 as a real change.
- **2000-2024 is the complete period.** 1985-1999 and 2025 are grey on the slider track
  (*Electricity only / partial coverage*): no emissions, few countries report bioenergy, and 2025
  covers only major producers. Emissions views show a notice before 2000.
- A continent-year whose countries cover less than 80% of OWID's continent generation is
  hatched, and its tooltip says how many countries it sums. Only Africa falls below it (73-75%
  in 1985-1999, 67% in 2025). 90% was rejected (South America sits on it), and so was 75%
  (Africa's pre-2000 years fall on both sides).
- Time series use a fixed 2000-2024 axis: before 2000 continent sums jump when countries enter
  the data (Africa: 306 to 441 TWh from 1999 to 2000).
- OWID puts Russia in Europe, and Turkey, Kazakhstan and Georgia in Asia; the app says so.
- The app opens on **2024**, the latest year with near-complete coverage.

## 2. The phenomenon

From 2000 to 2024 the renewable share of world electricity rose from 19% to 32%, mostly from
solar and wind (0.2% to 15%). Germany went from 6% to 59% renewable, the UK from 3% to 51%,
Spain from 16% to 57%.

But world generation doubled (about 15,300 to 30,900 TWh). Demand grew faster than clean
capacity, so emissions from electricity rose about 80% (8.1 to 14.6 GtCO₂e). Some grids
decarbonised fast; others met demand with coal. A few lost renewable share: the Philippines
went from 43% to 20%.

Electricity is where low-carbon technology is most mature, it is a large CO₂ source, and it
grows as transport and heating electrify. Limitation: it is only about 20% of primary energy,
so oil in transport is out of scope.

## 3. Target user

> Revised after the iteration-1 presentation (26/10): the first version had two generic
> personas without clear tasks (see [../iteration2/01-integration-plan.md](../iteration2/01-integration-plan.md)).

**Persona: Carla, 34, energy and environment analyst.**

- **Who.** Environmental engineer at a public energy agency; writes its briefings on the
  electricity transition. Reads charts and spreadsheets daily, knows TWh and gCO₂e/kWh, does
  not program.
- **Assignment.** A board briefing comparing Europe and Asia: *"Has the growth of renewables
  actually reduced emissions from electricity? Where has it, where has it not, and why?"*
- **Pain.** OWID shows one chart at a time. She opens dozens of charts, exports CSVs and computes
  continent totals and the demand/mix split in a spreadsheet. She cannot see a continent and its
  countries together.
- **Needs.**
  - **N1.** See continents first, with aggregated values.
  - **N2.** Inside a continent, find countries whose renewable share rose and check whether
    their emissions fell.
  - **N3.** Keep a short list of countries and compare them.
  - **N4.** Know whether an emissions change came from demand or from a cleaner mix, with
    exact values.

**Tasks** (also the usability-test tasks, worded for testers without energy background):

| # | Task | Need | Where in the UI |
|---|---|---|---|
| T1 | Which continent emits the most CO₂e from electricity in 2024, and which one cut the CO₂e per unit of electricity the most since 2000? | N1 | World: emissions area, map (*Change*) |
| T2 | What does Asia make most of its electricity from in 2024? And Europe? | N1 | World: Marimekko |
| T3 | In Asia, among the countries that gained the most renewables since 2014, find one whose CO₂e still went up. | N2 | Continent: sorted bars + CO₂e column |
| T4 | In Europe, select the countries with dirty electricity that use a lot of it per person. Name two. | N2 | Continent: bubble scatter + brush |
| T5 | In Europe, put three countries side by side. Which has the cleanest electricity, and is it cleaner than Europe as a whole? | N3 | Comparison list, Compare: radar with the Europe reference |
| T6 | For one of them: did its CO₂e change mostly because it made more electricity, or because it changed how it makes it? | N4 | Compare: "Why emissions changed" |

## 4. Objective

Help an energy analyst answer, in one session and without exporting data, **whether the growth
of low-carbon electricity has reduced emissions from electricity, first by continent and then
by country, and whether each change came from demand or from the mix.** It is met when test
participants complete T1-T6.

**Scope.** World shows all six continents. The Continent screen is built for **Europe** (most
advanced transition) and **Asia** (58% of world electricity, with China and India) first;
other continents are future work.

## 5. Context of use

- Desktop browser at work, 10-15 minute sessions while preparing a briefing.
- Starts from a concrete question (T1-T6), then open exploration.
- Values must be quotable: tooltips give value, unit and year. Units are explained in tooltips.

## 6. Key questions

Design: [../iteration2/01-integration-plan.md](../iteration2/01-integration-plan.md#final-design-three-coordinated-views).

1. **Which continents made their electricity greener, and which emit the most?** View A: map,
   Marimekko, emissions area (T1).
2. **What is a continent's or country's electricity made of?** Marimekko; mix over time in View C (T2).
3. **Which countries go against the trend?** View B: sorted bars with the CO₂e change, bubble
   scatter, map (T3, T4).
4. **Is clean generation keeping up, and why did emissions change?** View C: difference chart
   and decomposition (T6).
5. **How do the chosen countries or continents compare with each other and their reference?**
   View C: radars with a reference shape and per-person values (T5, T6).
