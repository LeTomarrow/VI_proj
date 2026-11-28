# Green Paradox

*Greener, but not cleaner? The global electricity transition, 1985-2025.*

Information Visualisation (UA, 2026/2027, 1st semester), practical assignment: a
[D3.js](https://d3js.org/) application to explore one data set. Brief: [`docs/guidelines`](docs/guidelines) (PDF).

**Objective:** help an energy analyst find out, by continent and then by country, whether the
growth of low-carbon electricity reduced emissions from electricity, and whether each change
came from demand or from the mix. Persona and tasks: [`docs/iteration1/01-data-analysis.md`](docs/iteration1/01-data-analysis.md).

- Plan, status, removed ideas and decisions: [`docs/iteration2/01-integration-plan.md`](docs/iteration2/01-integration-plan.md)
- Delivery checklist (30/11): [`docs/presentation/checklist-30-11.txt`](docs/presentation/checklist-30-11.txt)
- Delivery file name: `TP?-GreenParadox-118741+119586` (`?` = class number)

**Group:** Paulo Cunha (118741), Tomás Gameiro (119586).

## Repository

```
data/
  owid-energy-data.csv      OWID Energy dataset
  owid-continents.csv       OWID country to continent mapping
  iso-numeric.json          Map polygon ids to OWID codes (generated)
  summary.json              Numbers for the landing page (generated)
  sus-results.json          Anonymous SUS results for the findings page (filled by hand)
docs/
  guidelines                Assignment brief (PDF)
  iteration1/               Due 26/10: data analysis, visualisation choices, paper test,
                            concepts.md (study notes, in Portuguese), low-fi-prototype/
  iteration2/               Due 30/11: integration plan, heuristic evaluation, user tests
  presentation/             Checklist, slides/, video/
prototype/paper-sketches/   Photos of the iteration-1 paper prototype
scripts/                    Dev-only data builds (Node): build-iso-map.mjs, build-summary.mjs
src/
  index.html                Landing page
  app.html                  The application (Views A, B, C)
  findings.html             Conclusions and evaluation results
  css/                      style.css (app), site.css (landing and findings)
  js/main.js                App entry point; landing.js, findings.js for the other pages
  js/state.js, controls.js  Shared view state and the filters that change it
  js/scales.js, tooltip.js  Metrics, colours, shared tooltip
  js/charts/                One module per chart
  js/data/                  Loading, preprocessing and the pure logic of each view
tests/                      node:test, one file per view, with the task answers on the real data
compose.yaml, nginx.conf    Docker setup to serve the app
```

## Running

Plain HTML/CSS/JS with D3 from a CDN: no build step.

```bash
docker compose up -d      # open http://localhost:8002/src/
docker compose down
```

Without Docker, serve the **repository root** (the app reads `../data/`):

```bash
python3 -m http.server 8000   # open http://localhost:8000/src/
```

Rebuild the generated data (only if the map or the data changes) and run the tests:

```bash
npm install
npm run build:iso        # data/iso-numeric.json
npm run build:summary    # data/summary.json
npm test                 # node --test tests/
```

The tests need no browser. `viewA.test.mjs` covers the map, Marimekko, emissions, T1-T2, motion
and the landing and findings numbers; `viewB.test.mjs` the bars, scatter, brush, T3-T4;
`viewC.test.mjs` the comparison, radars, rows, decomposition, T6.

## GitHub Pages

Deployed on GitHub Pages: [Green Paradox](https://letomarrow.github.io/VI_proj/).

## Use of AI

The students chose the theme, persona, tasks and designs and are responsible for the content.

| Tool | Used for | Contribution |
|---|---|---|
| Claude Code (Anthropic) | Reviewing docs against the brief, drafting and editing docs, writing and refactoring chart code, checking palettes for colour blindness | Students reviewed, tested in the browser and changed the code and text; decisions are in the decision log |

> TODO before delivery: add any other tool used (e.g. ChatGPT, Copilot) and for what.

## Non-original code and libraries

- Data: Our World in Data, *Energy* and *Continents according to Our World in Data* (CC BY 4.0).
- Base map: [world-atlas](https://github.com/topojson/world-atlas) 2.0.2 (`countries-50m.json`,
  from Natural Earth), read with [topojson-client](https://github.com/topojson/topojson-client).
- Libraries: D3.js v7 and topojson-client v3 from jsDelivr;
  [i18n-iso-countries](https://github.com/michaelwittig/node-i18n-iso-countries) (dev only).
- Method: LMDI decomposition (Ang, 2005) in `src/js/data/greenGrowth.js`.
- Chart bases (D3 examples): [World choropleth](https://observablehq.com/@d3/world-choropleth),
  [Marimekko chart](https://observablehq.com/@d3/marimekko-chart),
  [Stacked area chart](https://observablehq.com/@d3/stacked-area-chart).
