# 1st Iteration — Data, Phenomenon, Users & Questions

> Covers the guideline's first-iteration requirement: "Analysis of the data and the phenomenon
> they represent, of users, context of use and main questions that the application should help
> to answer."

**Theme:** *Greener, but not cleaner? The global electricity transition, 1985–2025.*

## 1. The data

- **Source:** Our World in Data, Energy dataset — https://github.com/owid/energy-data
- **Licence:** Creative Commons BY 4.0. The data can be reused freely as long as the source is
  credited. OWID compiles it mainly from Ember and the Energy Institute *Statistical Review of
  World Energy*, and the application credits all three.
- **Citation:** Hannah Ritchie, Pablo Rosado and Max Roser (2023), "Energy". Published online
  at OurWorldinData.org.
- **File:** `data/owid-energy-data.csv`
- **Size:** 23,377 rows (country/region × year, 1900–2025) × 130 columns
- **Granularity:** one row per (country or region, year) — annual values, no monthly data

### 1.1 Scope: the electricity sector

The dataset contains two families of variables:

| Family | Columns | Countries with data | Years |
|---|---|---|---|
| Primary energy (all uses: transport, industry, heating, electricity) | `*_consumption`, `*_share_energy` | 79 (breakdown by source) | 1965–2024 |
| Electricity | `*_electricity`, `*_share_elec` | ~210 | 1985–2025 |

The application focuses on **electricity**. It is the only family with a per-source breakdown
for almost every country. It also has emissions variables of its own, so every view can use the
same units and the same countries without a second dataset. Mixing the two families would make
countries incomparable, because electricity is usually much "greener" than total energy use.
In 2023, for example, Portugal's electricity was 74% renewable, but its total energy was only
35% renewable. Primary-energy, production (`*_production`) and pre-computed change columns
(`*_change_pct`, `*_change_twh`) are therefore not used. `gdp` and `energy_per_gdp` are also
dropped, because they end in 2022.

### 1.2 Variables used (16 of 130)

| Group | Variables | Unit |
|---|---|---|
| Identification | `country`, `year`, `iso_code` | — |
| Normalisation | `population` | people |
| Electricity mix | `coal_electricity`, `oil_electricity`, `gas_electricity`, `nuclear_electricity`, `hydro_electricity`, `solar_electricity`, `wind_electricity`, `biofuel_electricity`, `other_renewable_exc_biofuel_electricity` | TWh |
| Total | `electricity_generation` | TWh |
| Emissions | `greenhouse_gas_emissions` (from electricity generation) | MtCO₂e |
| Emissions | `carbon_intensity_elec` | gCO₂/kWh |

The other renewables are taken from `other_renewable_exc_biofuel_electricity`. The
`other_renewable_electricity` column already includes bioenergy, so using it would count
bioenergy twice.

**Derived in the application** (not read from the file, so they are computed the same way
everywhere):
- each source's share of generation (%), and three groups: fossil (coal + oil + gas),
  renewable (hydro + solar + wind + bioenergy + other) and low-carbon (renewable + nuclear);
- per-capita values (÷ `population`);
- averages over a range of years and changes between two years, both selected by the user.

- continent totals, computed from the countries of each continent (see 1.3).

Calculations that belong to a single view (the emissions decomposition, the scaling of the
radar axes) are described with that view in
[02-visualization-choices.md](02-visualization-choices.md).

### 1.3 Preprocessing

- Aggregate rows (`iso_code` empty or starting with `OWID_`) are removed. The only exception is
  `World`, which is kept as a reference line.
- Years are limited to **1985–2025**.
- In a row where `electricity_generation` exists but a source is empty, that source is treated
  as **0**. This was checked on all 808 such rows between 2000 and 2024: the remaining sources
  always add up to the total generation.
- The result is 6,603 rows for 215 countries (214 with an ISO code, plus Kosovo).
- Each country is assigned to a continent with OWID's own mapping,
  `data/owid-continents.csv` (countries with data in 2024: Africa 51, Asia 50, Europe 41
  with Kosovo, North America 29, Oceania 14, South America 12). All 215 countries are mapped.
  Continent totals are the sum of their countries' TWh and MtCO₂e, and shares and carbon
  intensity are recomputed from those sums, never averaged. For 2000–2024 the sums match
  OWID's own continent rows within 1% for generation and emissions; the app checks this when
  it loads the data.
- **Joining the data to the map.** The map (`world-atlas`) identifies countries by numeric ISO
  code (`716`) and OWID by three-letter code (`ZWE`). A one-off script converts them with
  `i18n-iso-countries` into `data/iso-numeric.json`, which the app loads. All 236 map
  polygons with an id are converted. Caveats: Kosovo has no ISO code in either source and is
  keyed by name as `OWID_KOS`; French Guiana, Guadeloupe, Martinique and Réunion are drawn as
  part of France's polygon (and take its colour), and Gibraltar has no polygon. All of them
  still count in their continent's totals.

### 1.4 Coverage and how gaps are handled

| Years | Countries with electricity mix | Carbon intensity | Emissions |
|---|---|---|---|
| 1985–1989 | 76 | — | — |
| 1990–1999 | 81 | 33 | — |
| 2000–2024 | ~196–211 | ~195–210 | ~196–211 |
| 2025 | 90 (all major producers) | 90 | 90 |

The display rules follow from this coverage:
- Countries without data for the selected year are shown in a neutral grey, with a "no data"
  label.
- A coverage indicator next to the year slider shows how many countries have data
  ("Data available: 81 / 214 countries"). This keeps users from reading the jump in 2000 as a
  real-world change.
- Emissions-based views show a notice for years before 2000.
- **2000–2024 is the complete period.** The year slider covers 1985–2025, but 1985–1999 and
  2025 are drawn in grey on the slider track with the label *"Electricity only / partial
  coverage"*: in those years there are no emissions, bioenergy and other renewables are
  reported by only 33 of 81 countries, and 2025 covers only the major producers.
- A continent-year whose countries cover less than 80% of OWID's own continent generation
  (for 2025, of the continent's 2024 total) is hatched on the map and in the Marimekko, and its
  tooltip says how many countries it sums (e.g. "Sum of 4/57 countries with data", out of the continent's countries that
  have data in any year). Only
  Africa falls below it: 73–75% in 1985–1999 and 67% in 2025. All other continents stay
  at 90% or more. 90% was rejected because South America sits right at it, and 75% because
  Africa's pre-2000 years fall on both sides of it.
- Time-series charts (difference chart and decomposition) use a fixed 2000–2024 axis. Before
  2000, continent sums jump when countries enter the data (Africa: 306 → 441 TWh from 1999 to
  2000), and a time series would show that jump as real growth.
- OWID's mapping puts Russia in Europe, and Turkey, Kazakhstan and Georgia in Asia. The
  application states this next to the continent selector.
- The application opens on **2024**, the most recent year with near-complete coverage.

## 2. The phenomenon

Between 2000 and 2024, the share of the world's electricity from renewable sources rose from
19% to 32%. Most of this came from solar and wind, which grew from 0.2% to 15% of global
generation. Some countries moved from marginal to majority-renewable grids in two decades:
Germany went from 6% to 59%, the United Kingdom from 3% to 51%, and Spain from 16% to 57%.

Over the same period, however, global electricity generation doubled, from about 15,300 to
30,900 TWh. Because demand grew faster than clean capacity, emissions from power generation
rose by about 80%, from 8.1 to 14.6 GtCO₂e. The transition is real but uneven. Some grids
decarbonised quickly, while others met rising demand mostly with coal. A few even saw their
renewable share fall: the Philippines went from 43% to 20%.

Electricity is a natural lens for this phenomenon. It is where low-carbon technologies are most
mature, it is one of the largest sources of CO₂, and its role is growing as transport and
heating electrify. A known limitation is that electricity is only about 20% of the world's
primary energy, so oil used in transport falls outside the scope. The application lets users
see where electricity is getting greener, who still relies on fossil fuels, and whether green
growth is keeping up with demand.

## 3. Target user

> Revised after the iteration-1 presentation (26/10/2026). The first version had two generic
> personas (a student and a journalist) without clear tasks. The feedback asked for one well
> defined persona whose tasks and needs drive the interface. See
> [../iteration2/01-integration-plan.md](../iteration2/01-integration-plan.md).

**Persona: Carla, 34, energy and environment analyst.**

- **Who she is.** Environmental engineer at a public energy agency. She writes the agency's
  briefings on the electricity transition. She reads charts and uses spreadsheets every day and
  knows the units (TWh, gCO₂/kWh). She does not program.
- **Current assignment.** A briefing for the agency board comparing Europe and Asia: *"Has the
  growth of renewables actually reduced emissions from electricity? Where has it, where has it
  not, and why?"*
- **Pain today.** OWID shows one chart at a time. To answer, she opens dozens of country charts,
  exports CSV files and computes continent totals and the demand/mix split herself in a
  spreadsheet. She cannot see the continent and its countries together, or put countries from
  different continents side by side.
- **Needs.**
  - **N1.** See the continents first, with aggregated values, before looking at 200 countries.
  - **N2.** Inside one continent, find the countries whose renewable share rose and check
    whether their emissions fell.
  - **N3.** Keep a short list of chosen countries, from any continent, and compare them.
  - **N4.** Know whether a change in emissions came from more demand or from a cleaner mix,
    with exact values she can quote.

**Tasks** (these are also the usability-test tasks):

| # | Task | Need | Where in the UI |
|---|---|---|---|
| T1 | Which continent's electricity became greener the most between 2000 and 2024, and which continent emits the most? | N1 | World screen |
| T2 | In Europe, which countries had the largest rise in renewable share between 2014 and 2024, and did their emissions also fall? | N2 | Continent screen |
| T3 | Add two of those countries and one Asian country to the comparison list. | N3 | Comparison list (any screen) |
| T4 | For each compared country, did new low-carbon generation cover the growth in demand, and was the change in emissions driven by demand or by the mix? | N4 | Compare screen |

## 4. Objective

Help an energy and environment analyst answer, in one breef session and without exporting data, **whether the growth of low-carbon electricity has reduced emissions from
electricity generation, first by continent and then by country, and whether each change was driven by demand or by the electricity mix.**

The objective is met when participants in the usability tests complete T1–T4.

**Scope.** The World screen shows all six continents. The Continent screen is built first
for **Europe** and **Asia**: Europe is where the transition is most advanced, and Asia produces
58% of the world's electricity, including China and India. Country-level screens for the other
continents are future work if time runs out.

## 5. Context of use

- A desktop browser at work, in sessions of about 10 to 15 minutes, while preparing a briefing.
- The session starts from a concrete question (T1–T4), followed by some open exploration.
- Values must be exact and quotable: tooltips give the value with its unit and year.
- No prior knowledge of the dataset is assumed. Units are explained in tooltips.

## 6. Key questions the application should help answer

Each question is answered by one group of linked charts. The design is detailed in
[../iteration2/01-integration-plan.md](../iteration2/01-integration-plan.md#final-design-three-coordinated-views).

1. **Which continents have made their electricity greener, and which emit the most?**
   *(View A: map by continent + Marimekko by continent + stacked area of emissions by
   continent)* (T1)
2. **What is a continent's or country's electricity made of?** *(Marimekko in Views A and B;
   mix over time, in kWh per person, in View C)*
3. **Which countries in a continent go against the trend?** Which had the largest rise in
   renewable share, and did their emissions fall? *(View B: sorted bars of the change in
   renewable share + bubble scatter + map)* (T2)
4. **Is clean generation keeping up with total generation, and why did emissions change?**
   *(View C: difference chart + demand/mix decomposition)* (T4)
5. **How do the chosen countries compare, even across continents?** *(Country search +
   comparison list + View C, in per-person values so that large and small countries are
   comparable)* (T3, T4)
