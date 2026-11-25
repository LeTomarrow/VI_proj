// View B (Continent): ranked bars + mix columns, sorted bars of the change, bubble scatter +
// brush and its "+ Compare"; tasks T3-T4 on the real data.
import test from 'node:test';
import assert from 'node:assert/strict';
import { indexByKey, realData, record } from './helpers.mjs';

const { rankedColumns, comparedColumns, rankMax } = await import('../src/js/data/countryColumns.js');
const { changeRows, changeCountryKeys } = await import('../src/js/data/change.js');
const { brushedKeys, inRegion, scatterTrailKeys, shownAt, validBubble } = await import('../src/js/data/scatter.js');
const { RANKS } = await import('../src/js/scales.js');
const st = await import('../src/js/state.js');
const { state, setState } = st;

const rank = (key) => RANKS.find((r) => r.key === key);
const s2024 = { year: 2024, mode: 'year', metric: 'renewableShare', compared: [], hovered: null };

// Europe: four countries, Asia: one.
const europe = [
  record({ key: 'DEU', coal: 100, wind: 150, solar: 50 }),
  record({ key: 'FRA', nuclear: 300, hydro: 50 }),
  record({ key: 'PRT', gas: 10, wind: 20, hydro: 20 }),
  record({ key: 'MLT', gas: 2 }),
];
const china = record({ key: 'CHN', continent: 'Asia', coal: 5000, solar: 800 });
const byCountry = indexByKey([...europe, china]);
const keys = europe.map((r) => r.key);
const countriesOf = new Map([['Europe', keys], ['Asia', ['CHN']]]);

test('ranked columns: top N by the ranked value, ties by total; zero values left out', () => {
  const cols = rankedColumns({ byCountry, keys, compared: [], rank: rank('generation') }, s2024, 2);
  assert.deepEqual(cols.records.map((r) => r.key), ['FRA', 'DEU']);
  const wind = rankedColumns({ byCountry, keys, compared: [], rank: rank('wind') }, s2024, 10);
  assert.deepEqual(wind.records.map((r) => r.key), ['DEU', 'PRT'], 'France and Malta have no wind');
  assert.equal(wind.position.get('PRT'), 2);
  assert.equal(wind.total, 4);
});

test('ranked columns: compared countries outside the top N follow on the right', () => {
  const cols = rankedColumns({ byCountry, keys, compared: ['MLT'], rank: rank('generation') }, s2024, 2);
  assert.deepEqual(cols.extra.map((r) => r.key), ['MLT']);
  assert.equal(cols.position.get('MLT'), 4);
  assert.ok(cols.stats.has('MLT'));
});

test('compared view: only the compared countries, ranked, with their rank in their continent', () => {
  const cols = comparedColumns({ byCountry, countriesOf, compared: ['PRT', 'DEU'], rank: rank('lowCarbon') }, s2024);
  assert.deepEqual(cols.records.map((r) => r.key), ['DEU', 'PRT']);
  assert.equal(cols.position.get('PRT'), 3, 'after France and Germany');
});

test('the bars keep one scale over the years: the largest value of any year', () => {
  const later = indexByKey([...europe, record({ key: 'DEU', year: 2000, coal: 500 })]);
  assert.equal(rankMax(later, keys, rank('generation')), 500);
  assert.equal(rankMax(later, [], rank('generation')), 0);
});

test('sorted bars: change in renewable share, largest gain first, with the CO₂e change in %', () => {
  const rows = indexByKey([
    record({ key: 'A', year: 2014, coal: 80, wind: 20, emissions: 80 }),
    record({ key: 'A', year: 2024, coal: 40, wind: 60, emissions: 40 }),
    record({ key: 'B', year: 2014, coal: 90, wind: 10, emissions: 90 }),
    record({ key: 'B', year: 2024, coal: 150, wind: 50, emissions: 135 }),
    record({ key: 'C', year: 2024, wind: 10 }),
  ]);
  const out = changeRows(['A', 'B', 'C'], rows, 2014, 2024);
  assert.deepEqual(out.map((r) => r.key), ['A', 'B'], 'C has no 2014 data');
  assert.equal(out[0].renewable, 40);
  assert.equal(out[1].renewable, 15);
  assert.equal(out[1].emissions, 50, 'B gained renewables and still emits 50% more (T3)');
  assert.deepEqual(changeRows(['A'], rows, 2024, 2014), []);
});

test('scatter: only countries with emissions are drawn; Show hides small emitters', () => {
  const tiny = record({ key: 'MLT', gas: 2, emissions: 0.9 });
  assert.equal(validBubble(record({ key: 'X', hydro: 1, emissions: 0 })), false);
  assert.equal(shownAt(tiny, { scatterMin: 0 }), true);
  assert.equal(shownAt(tiny, { scatterMin: 1 }), false);
});

test('scatter: country comparisons filter bubbles; clearing restores the saved emissions filter', () => {
  const tiny = record({ key: 'MLT', gas: 2, emissions: 0.9 });
  const portugal = record({ key: 'PRT', gas: 20, emissions: 12 });
  const germany = record({ key: 'DEU', coal: 100, emissions: 80 });
  const records = [tiny, portugal, germany];
  const s = { scatterMin: 10, compared: ['MLT', 'PRT'] };
  assert.deepEqual(records.filter((r) => shownAt(r, s)).map((r) => r.key), ['MLT', 'PRT']);
  assert.deepEqual(records.filter((r) => shownAt(r, { ...s, compared: ['PRT'] })).map((r) => r.key), ['PRT']);
  assert.deepEqual(records.filter((r) => shownAt(r, { ...s, compared: [] })).map((r) => r.key), ['PRT', 'DEU']);
  assert.deepEqual(records.filter((r) => shownAt(r, { scatterMin: 0, compared: [] })).map((r) => r.key), ['MLT', 'PRT', 'DEU']);
  assert.equal(shownAt(portugal, { scatterMin: 0, compared: ['Europe'] }), true, 'continent comparisons do not filter countries');
  assert.equal(shownAt({ ...portugal, emissions: null }, s), false, 'missing emissions remain unavailable');
});

test('brush: unselected countries cannot be brushed while comparing countries', () => {
  const records = [record({ key: 'PRT', gas: 10, emissions: 5 }), record({ key: 'DEU', coal: 100, emissions: 80 })];
  const s = { level: 'continent', continent: 'Europe', year: 2024, compared: ['PRT'],
    brush: { continent: 'Europe', x: [0, 1000], y: [0, 2000] } };
  assert.deepEqual([...brushedKeys(['PRT', 'DEU'], indexByKey(records), s)], ['PRT']);
});

test('brush: a region in data units; follows the year; ignored on another continent', () => {
  const recs = [
    record({ key: 'POL', population: 1e6, coal: 10, emissions: 8 }),   // 8 t/person, 800 g/kWh
    record({ key: 'SWE', population: 1e6, hydro: 10, emissions: 0.2 }), // 0.2 t/person, 20 g/kWh
    record({ key: 'POL', year: 2000, population: 1e6, coal: 1, emissions: 0.5 }), // 0.5 t/person
  ];
  const by = indexByKey(recs);
  const brush = { continent: 'Europe', x: [1, 20], y: [500, 1200] };
  const s = { level: 'continent', continent: 'Europe', year: 2024, brush, scatterMin: 0 };
  assert.deepEqual([...brushedKeys(['POL', 'SWE'], by, s)], ['POL']);
  assert.deepEqual([...brushedKeys(['POL', 'SWE'], by, { ...s, year: 2000 })], [], 'in 2000 Poland is outside the box');
  assert.equal(brushedKeys(['POL'], by, { ...s, continent: 'Asia' }), null);
  assert.equal(brushedKeys(['POL'], by, { ...s, brush: null }), null);
  assert.deepEqual([...brushedKeys(['POL'], by, { ...s, scatterMin: 10 })], [], 'hidden countries are not selected');
  assert.equal(inRegion(recs[0], brush), true);
});

test('outside the brush: a summed column is inside if any of its countries is', () => {
  const s = { brushed: new Set(['PRT']), hovered: null };
  assert.equal(st.isOutsideBrush(['ESP'], s), true);
  assert.equal(st.isOutsideBrush(['ESP', 'PRT'], s), false);
  assert.equal(st.isOutsideBrush(['ESP'], { brushed: null }), false);
});

test('a second compared country switches the mix chart to the compared countries', () => {
  setState({ level: 'continent', continent: 'Europe', compared: [], mekkoCompared: false });
  st.toggleCompared('PRT');
  assert.equal(state.mekkoCompared, false);
  st.toggleCompared('ESP');
  assert.equal(state.mekkoCompared, true);
});

test('+ Compare (scatter brush): adds in order up to the limit, keeps the list, skips duplicates', () => {
  setState({ level: 'continent', continent: 'Europe', compared: ['PRT'], mekkoCompared: false });
  const added = st.addCompared(['PRT', 'DEU', 'ESP', 'FRA', 'ITA', 'POL']);
  assert.deepEqual(added, ['DEU', 'ESP', 'FRA', 'ITA']);
  assert.deepEqual(state.compared, ['PRT', 'DEU', 'ESP', 'FRA', 'ITA']);
  assert.equal(state.mekkoCompared, true);
  assert.deepEqual(st.addCompared(['POL']), [], 'a full list adds nothing');
  setState({ compared: ['Asia'] });
  st.addCompared(['PRT']);
  assert.deepEqual(state.compared, ['PRT'], 'countries replace continents');
});

test('T3: in Asia, among the largest renewable gains since 2014, Turkey and China still emit more', () => {
  const { byCountry: real, countriesOf: of } = realData();
  const rows = changeRows(of.get('Asia'), real, 2014, 2024).slice(0, 10);
  const named = new Map(rows.map((r) => [r.key, r]));
  for (const key of ['TUR', 'CHN']) {
    assert.ok(named.has(key), `${key} in the top 10 gains`);
    assert.ok(named.get(key).emissions > 0, `${key} CO₂e rose`);
  }
  assert.ok(Math.abs(named.get('TUR').renewable - 24.7) < 0.1);
});

test('T4: in Europe, the countries above the World on both axes include Kosovo, Serbia, Bosnia and Poland', () => {
  const { byCountry: real, countriesOf: of, byWorld } = realData();
  const w = byWorld.get(2024);
  const dirty = of.get('Europe').map((k) => real.get(k)?.get(2024))
    .filter((r) => r?.emissionsPerCapita > w.emissionsPerCapita && r.carbonIntensity > w.carbonIntensity)
    .map((r) => r.key);
  for (const key of ['OWID_KOS', 'SRB', 'BIH', 'POL']) assert.ok(dirty.includes(key), `${key} in ${dirty}`);
});


test('scatter paths: Change reveals only the hovered compared country, with no idle clutter', () => {
  const keys = ['PRT', 'ESP', 'DEU'];
  const s = { mode: 'change', compared: keys, hovered: null };
  assert.deepEqual(scatterTrailKeys(keys, s), []);
  assert.deepEqual(scatterTrailKeys(keys, { ...s, hovered: 'PRT' }), ['PRT']);
  assert.deepEqual(scatterTrailKeys(keys, { ...s, hovered: 'ESP' }), ['ESP']);
  assert.deepEqual(scatterTrailKeys(keys, { ...s, hovered: 'FRA' }), []);
  assert.deepEqual(scatterTrailKeys(['ESP', 'DEU'], { ...s, hovered: 'PRT' }), [], 'no path for a country with no visible bubble');
  assert.deepEqual(scatterTrailKeys(keys, { ...s, hovered: 'PRT', mode: 'year' }), []);
  assert.deepEqual(scatterTrailKeys(keys, { ...s, hovered: 'PRT', compared: [] }), []);
});


test('country-change selection shows only compared countries and restores the continent when cleared', () => {
  const keys = ['PRT', 'ESP', 'DEU'];
  assert.deepEqual(changeCountryKeys(keys, ['PRT', 'DEU']), ['PRT', 'DEU']);
  assert.deepEqual(changeCountryKeys(keys, ['PRT']), ['PRT']);
  assert.deepEqual(changeCountryKeys(keys, []), keys);
  assert.deepEqual(changeCountryKeys(keys, ['Europe']), keys);
  assert.deepEqual(changeCountryKeys(keys, ['CHN']), [], 'countries outside the continent are not added');
});
