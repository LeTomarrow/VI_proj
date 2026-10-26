# VI_proj — [App name TBD]

Information Visualisation (UA, 2026/2027, 1st semester) — Practical Assignment.
An application for the visual exploration of a data set, built with [D3.js](https://d3js.org/).

See the full assignment brief in [`docs/guidelines`](docs/guidelines) (PDF).

## Theme

Dataset: [Our World in Data — Energy](https://github.com/owid/energy-data) (`data/owid-energy-data.csv`),
~23k rows × 130 variables covering energy production/consumption/mix by country and year.

**Greener, but not cleaner? The global electricity transition, 1985–2025.**

Objective: help an energy and environment analyst find out, first by continent and then by
country, whether the growth of low-carbon electricity has reduced emissions from electricity
generation, and whether each change was driven by demand or by the electricity mix. The persona,
tasks and scope are in [`docs/iteration1/01-data-analysis.md`](docs/iteration1/01-data-analysis.md).

Current plan, status and decisions: [`docs/iteration2/01-integration-plan.md`](docs/iteration2/01-integration-plan.md).

## Group

- Student 1: Paulo Cunha (118741)
- Student 2: Tomás Gameiro (119586)

## Repository structure

```
data/                   Raw dataset(s) used by the application
  owid-energy-data.csv          OWID Energy dataset
  owid-continents.csv           OWID country → continent mapping
  iso-numeric.json              Map polygon ids → OWID country codes (generated)
docs/
  guidelines            Assignment brief (PDF, as provided by the instructor)
  iteration1/           1st iteration deliverables (due 26/10)
    01-data-analysis.md         Data, phenomenon, users, context, key questions
    02-visualization-choices.md Justified choice of representation/presentation/interaction techniques
    low-fi-prototype/           Paper or Balsamiq low-fidelity prototype assets
    03-usability-testing.md     Usability test plan, tasks, and results
  iteration2/            2nd iteration deliverables (due 30/11)
    01-integration-plan.md      How iteration-1 feedback fed into the d3.js build; status and decision log
    02-heuristic-evaluation.md  Heuristic evaluation results
    03-user-testing.md          Final usability test plan and results
  presentation/
    slides/              Final presentation slides
    video/                Short demo video
prototype/
  paper-sketches/         Scans/photos of paper prototypes (if not using Balsamiq)
scripts/                  Dev-only data preparation (Node), not needed to run the app
  build-iso-map.mjs             Builds data/iso-numeric.json (map ids → OWID codes)
src/                      The d3.js application (2nd iteration)
  index.html
  css/style.css
  js/main.js
  js/charts/              One module per view/visualisation
  js/data/                 Data-loading/preprocessing helpers
```

## Running the application

The app is plain HTML/CSS/JS with D3 loaded from a CDN — no build step or install required.
Serve the **repository root** with any static file server (the app loads the CSV from
`../data/...` relative to `src/index.html`), e.g.:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/src/
```

To rebuild `data/iso-numeric.json` (only needed if the map or the data changes):

```bash
npm install && npm run build:iso
```

## Use of AI

> TODO: disclose any AI tools used, for what purpose, and how they contributed — required by
> the assignment (see `docs/guidelines`).

## Non-original code / libraries

> TODO: list any reused code, templates, or libraries beyond D3.js itself, with references.

- Data: Our World in Data, *Energy* and *Continents according to Our World in Data*
  (CC BY 4.0).
- Base map: [world-atlas](https://github.com/topojson/world-atlas) 2.0.2 (`countries-50m.json`,
  derived from Natural Earth), read with [topojson-client](https://github.com/topojson/topojson-client).
