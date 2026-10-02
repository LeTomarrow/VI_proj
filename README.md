# VI_proj — [App name TBD]

Information Visualisation (UA, 2026/2027, 1st semester) — Practical Assignment.
An application for the visual exploration of a data set, built with [D3.js](https://d3js.org/).

See the full assignment brief in [`docs/guidelines`](docs/guidelines) (PDF).

## Theme

Dataset: [Our World in Data — Energy](https://github.com/owid/energy-data) (`data/owid-energy-data.csv`),
~23k rows × 130 variables covering energy production/consumption/mix by country and year.

> TODO: state the specific phenomenon/angle the group is exploring (e.g. the global
> transition from fossil fuels to renewables, energy independence, per-capita energy use).

## Group

- Class: TPnn
- Student 1: name (nmec)
- Student 2: name (nmec)

## Repository structure

```
data/                   Raw dataset(s) used by the application
docs/
  guidelines            Assignment brief (PDF, as provided by the instructor)
  iteration1/           1st iteration deliverables (due 26/10)
    01-data-analysis.md         Data, phenomenon, users, context, key questions
    02-visualization-choices.md Justified choice of representation/presentation/interaction techniques
    low-fi-prototype/           Paper or Balsamiq low-fidelity prototype assets
    03-usability-testing.md     Usability test plan, tasks, and results
  iteration2/            2nd iteration deliverables (due 30/11)
    01-integration-plan.md      How iteration-1 feedback fed into the d3.js build
    02-heuristic-evaluation.md  Heuristic evaluation results
    03-user-testing.md          Final usability test plan and results
  presentation/
    slides/              Final presentation slides
    video/                Short demo video
prototype/
  paper-sketches/         Scans/photos of paper prototypes (if not using Balsamiq)
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

## Use of AI

> TODO: disclose any AI tools used, for what purpose, and how they contributed — required by
> the assignment (see `docs/guidelines`).

## Non-original code / libraries

> TODO: list any reused code, templates, or libraries beyond D3.js itself, with references.
