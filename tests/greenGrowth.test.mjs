import test from 'node:test';
import assert from 'node:assert/strict';
import { decomposeEmissions, greenGrowthRows } from '../src/js/data/greenGrowth.js';

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ≈ ${expected}`);
const base = { year: 2000, generation: 100, lowCarbon: 20, emissions: 50 };

test('baseline is zero; constant intensity attributes the change to generation', () => {
  assert.deepEqual(decomposeEmissions(base, base), { demand: 0, mix: 0, net: 0 });
  const result = decomposeEmissions(base, { generation: 200, emissions: 100 });
  near(result.demand, 50);
  near(result.mix, 0);
});

test('constant generation attributes the change to the mix, including equal emissions', () => {
  assert.deepEqual(decomposeEmissions(base, { generation: 100, emissions: 25 }), { demand: 0, mix: -25, net: -25 });
  const result = decomposeEmissions(base, { generation: 200, emissions: 50 });
  near(result.demand, 50 * Math.log(2));
  near(result.demand + result.mix, 0);
});

test('Portugal 2000–2024: cleaner mix offsets generation growth exactly', () => {
  const result = decomposeEmissions({ generation: 43.21, emissions: 23.6 }, { generation: 47.27, emissions: 5.23 });
  assert.ok(result.demand > 1 && result.demand < 1.2);
  assert.ok(result.mix < -19 && result.mix > -20);
  near(result.net, -18.37);
  near(result.demand + result.mix, result.net);
});

test('missing data stays missing; zero emissions uses the LMDI limit', () => {
  assert.equal(decomposeEmissions(base, { generation: 100, emissions: null }), null);
  assert.equal(decomposeEmissions(base, { generation: 0, emissions: 0 }), null);
  assert.deepEqual(decomposeEmissions(base, { generation: 200, emissions: 0 }), { demand: 0, mix: -50, net: -50 });
});

test('annual rows preserve gaps and a missing baseline; reversed ranges are empty', () => {
  const records = [base, { year: 2002, generation: 110, lowCarbon: 40, emissions: 40 }];
  const rows = greenGrowthRows(records, 2000, 2002);
  assert.equal(rows[0].generation, 0);
  assert.equal(rows[1].generation, null);
  assert.equal(rows[1].effects, null);
  assert.equal(rows[2].generation, 10);
  assert.equal(rows[2].lowCarbon, 20);
  assert.ok(greenGrowthRows(records, 1999, 2002).every((r) => r.generation === null && r.effects === null));
  assert.deepEqual(greenGrowthRows(records, 2002, 2000), []);
});

test('exploration clears comparisons and brushes; filters retain it; comparing or navigating exits', async () => {
  globalThis.d3 = { dispatch: () => ({ call() {}, on() {} }) };
  const { state, setState, exploreGreenGrowth, toggleCompared, comparisonLimit } = await import('../src/js/state.js');
  setState({ level: 'continent', continent: 'Europe', compared: ['PRT', 'ESP'], brush: { x: [0, 1] } });
  exploreGreenGrowth('PRT');
  assert.equal(state.greenGrowthCountry, 'PRT');
  assert.deepEqual(state.compared, []);
  assert.equal(state.brush, null);
  setState({ year: 2023, metric: 'carbonIntensity' });
  assert.equal(state.greenGrowthCountry, 'PRT');
  toggleCompared('ESP');
  assert.equal(state.greenGrowthCountry, null);
  exploreGreenGrowth('PRT');
  setState({ level: 'world', continent: null });
  assert.equal(state.greenGrowthCountry, null);
  assert.equal(comparisonLimit('countries'), 4);
  assert.equal(comparisonLimit('continents'), 5);
});

test('explored country stays in the continent ranking outside Top N without joining comparison', async () => {
  const { rankedColumns } = await import('../src/js/data/countryColumns.js');
  const { isDimmed } = await import('../src/js/state.js');
  const records = [
    { key: 'DEU', year: 2024, generation: 100, renewableShare: 50 },
    { key: 'PRT', year: 2024, generation: 40, renewableShare: 75 },
  ];
  const byCountry = new Map(records.map((r) => [r.key, new Map([[r.year, r]])]));
  const s = { year: 2024, mode: 'year', metric: 'renewableShare', compared: [], greenGrowthCountry: 'PRT', hovered: null };
  const columns = rankedColumns({ byCountry, keys: ['DEU', 'PRT'], compared: [], rank: { value: (r) => r.generation } }, s, 1);
  assert.deepEqual(columns.records.map((r) => r.key), ['DEU']);
  assert.deepEqual(columns.extra.map((r) => r.key), ['PRT']);
  assert.deepEqual(s.compared, []);
  assert.equal(isDimmed('PRT', s, ['DEU', 'PRT']), false);
  assert.equal(isDimmed('DEU', s, ['DEU', 'PRT']), true);
  assert.equal(isDimmed('Europe', s, ['Europe', 'Asia']), false);
});
