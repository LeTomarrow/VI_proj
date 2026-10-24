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

Calculations that belong to a single view (the emissions decomposition in View 4, the scaling
of the radar axes in View 5) are described with that view in
[02-visualization-choices.md](02-visualization-choices.md).

### 1.3 Preprocessing

- Aggregate rows (`iso_code` empty or starting with `OWID_`) are removed. The only exception is
  `World`, which is kept as a reference line.
- Years are limited to **1985–2025**.
- In a row where `electricity_generation` exists but a source is empty, that source is treated
  as **0**. This was checked on all 808 such rows between 2000 and 2024: the remaining sources
  always add up to the total generation.
- The result is ~6,600 rows for 214 countries.

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

## 3. Target users

- **Students and educators** (secondary school or university, in environment, engineering or
  geography courses) who want to understand the energy transition with real data rather than
  headlines.
- **Journalists and science communicators** looking for evidence and comparisons between
  countries to support a story.

**Personas**

- **Inês, 21, environmental engineering student.** She is preparing a presentation on Europe's
  energy transition and wants to compare Portugal with other countries. She is comfortable with
  charts but not with raw data or spreadsheets.
- **Rui, 38, environment journalist.** He is writing a piece on whether renewables are actually
  reducing emissions. He needs to find the biggest emitters quickly, check a few specific
  countries and spot counter-examples worth reporting.

## 4. Context of use

- Self-directed exploration in a desktop web browser, in sessions of about 5 to 20 minutes.
- Usually driven by a specific question ("how does my country compare?") followed by open
  exploration.
- It may also be shown in a classroom or presentation, so the main message (the overview globe
  and the World trend) must be readable without interaction.
- No installation or prior knowledge of the dataset is assumed. Units (TWh, gCO₂/kWh) are
  explained in tooltips.

## 5. Key questions the application should help answer

1. **Where and when has electricity become greener?** How has the renewable share of each
   country's electricity changed between 1985 and 2025? *(globe with year slider, and range-average and change modes over a range of years)*
2. **What is a country's electricity made of, and how has it changed?** Which sources dominate,
   and which ones grew or declined? *(temporal Marimekko of the selected country's mix)*
3. **Who pollutes the most, and by which measure?** Which countries lead in total emissions,
   emissions per capita and carbon intensity per kWh, and do these rankings agree?
   *(emissions bubble scatter; country profiles to compare chosen countries)*
4. **Is green growth keeping up with demand?** Does new low-carbon generation cover the growth
   in demand, and do emissions actually fall? Is the change in emissions driven by demand or by
   a cleaner mix, and how does the country compare with the world?
   *(difference chart of new demand vs. new low-carbon generation, with the emissions
   decomposition)*
5. **Which countries go against the trend?** Which countries have a falling renewable share,
   rising carbon intensity, or high emissions despite a high renewable share?
   *(globe in change mode to find them; emissions bubble scatter
   coloured by renewable share; View 4 to confirm a country's path)*
