// View C (Compare) and the comparison list that opens it: radar profiles and their reference,
// the row columns (mix over time, clean vs total, the decomposition of CO₂e); task T6 and the
// findings on the real data.
import test from 'node:test';
import assert from 'node:assert/strict';
import { indexByKey, realData, record } from './helpers.mjs';

const { sourceProfile, referenceFor, compareColumnKeys } = await import('../src/js/data/compare.js');
const { mixRows } = await import('../src/js/charts/mixOverTime.js');
const { decomposeEmissions, greenGrowthRows } = await import('../src/js/data/greenGrowth.js');
const st = await import('../src/js/state.js');
const { state, setState } = st;

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);
const at = (byKey, key, year) => byKey.get(key).get(year);
const continentOf = (k) => ({ PRT: 'Europe', ESP: 'Europe', DEU: 'Europe', FRA: 'Europe', ITA: 'Europe', POL: 'Europe', CHN: 'Asia' })[k];
st.setContinentLookup(continentOf);
const reset = (patch = {}) => setState({ level: 'world', continent: null, compared: [], hovered: null, ...patch });
const base = { year: 2000, generation: 100, lowCarbon: 20, emissions: 50 };

test('radar profile: one share per source group, summing to 100; bioenergy and other merged', () => {
  const profile = sourceProfile(record({ coal: 50, hydro: 25, bioenergy: 15, otherRenewable: 10 }));
  assert.equal(profile.length, 8);
  near(d3.sum(profile, (v) => v.share), 100);
  assert.equal(profile.find((v) => v.key === 'bioOther').share, 25);
  assert.equal(sourceProfile(null), null);
  assert.equal(sourceProfile(record({})), null, 'no generation, no profile');
});

test('radar reference: World or the countries\' continent; continents only get the World', () => {
  const countries = referenceFor(['PRT', 'ESP'], 'continent', continentOf);
  assert.deepEqual(countries.options.map(([k]) => k), ['none', 'world', 'continent']);
  assert.equal(countries.pick, 'continent');
  assert.equal(countries.continent, 'Europe');
  const continents = referenceFor(['Asia', 'Europe'], 'continent', continentOf);
  assert.deepEqual(continents.options.map(([k]) => k), ['none', 'world']);
  assert.equal(continents.pick, 'world', 'an unavailable choice falls back to the World');
  assert.equal(referenceFor([], 'none', continentOf).pick, 'none');
});

test('row columns: countries get the mix; continents skip it (View A shows it)', () => {
  assert.deepEqual(compareColumnKeys(['PRT']), ['mix', 'race', 'effects']);
  assert.deepEqual(compareColumnKeys(['Asia', 'Europe']), ['race', 'effects']);
});

test('mix over time: kWh per person per source; years without data have no total', () => {
  const records = indexByKey([
    record({ year: 2000, population: 1e6, coal: 1, wind: 1 }),
    record({ year: 2002, population: 2e6, coal: 1 }),
  ]).get('AAA');
  const rows = mixRows(records, [2000, 2002]);
  assert.equal(rows.length, 3);
  assert.equal(rows[0].total, 2000, '2 TWh for 1 million people = 2,000 kWh each');
  assert.equal(rows[0].wind, 1000);
  assert.equal(rows[1].total, null);
  assert.equal(rows[2].coal, 500);
});

test('real data: View C rows for Portugal, Germany and Poland have every year of 2000-2024', () => {
  const { byCountry } = realData();
  for (const key of ['PRT', 'DEU', 'POL']) {
    const records = byCountry.get(key);
    assert.ok(mixRows(records, [2000, 2024]).every((r) => r.total > 0), `${key} mix`);
    const growth = greenGrowthRows([...records.values()], 2000, 2024);
    assert.equal(growth.length, 25);
    assert.ok(growth.every((r) => r.effects), `${key} decomposition every year`);
  }
});

test('real data: radars of Europe and the World are valid references in 2024', () => {
  const { byContinent, byWorld } = realData();
  for (const r of [byContinent.get('Europe').get(2024), byWorld.get(2024)]) {
    near(d3.sum(sourceProfile(r), (v) => v.share), 100, 1e-6);
  }
});

// Comparison list

test('the list holds continents or countries, never both; the other type replaces it', () => {
  reset({ compared: ['Asia', 'Europe'] });
  st.toggleCompared('PRT');
  assert.deepEqual(state.compared, ['PRT']);
  st.toggleCompared('Asia');
  assert.deepEqual(state.compared, ['Asia']);
});

test('5 continents or 5 countries at most; toggling removes', () => {
  reset({ level: 'continent', continent: 'Europe' });
  for (const k of ['PRT', 'ESP', 'DEU', 'FRA', 'ITA', 'POL']) st.toggleCompared(k);
  assert.deepEqual(state.compared, ['PRT', 'ESP', 'DEU', 'FRA', 'ITA']);
  st.toggleCompared('ESP');
  assert.deepEqual(state.compared, ['PRT', 'DEU', 'FRA', 'ITA']);
  assert.equal(st.MAX_COMPARED, 5);
});

test('the comparison belongs to a level: World keeps continents, a continent keeps its countries', () => {
  const mixed = ['PRT', 'CHN', 'Asia'];
  assert.deepEqual(st.scopeCompared(['PRT', 'ESP'], 'world', null, continentOf), []);
  assert.deepEqual(st.scopeCompared(['Asia', 'Europe'], 'world', null, continentOf), ['Asia', 'Europe']);
  assert.deepEqual(st.scopeCompared(['Asia', 'Europe'], 'continent', 'Europe', continentOf), []);
  assert.deepEqual(st.scopeCompared(mixed, 'continent', 'Europe', continentOf), ['PRT']);
  assert.deepEqual(st.scopeCompared(mixed, 'compare', 'Europe', continentOf), mixed);
  reset({ compared: ['Asia', 'Europe'] });
  st.goToLevel({ level: 'continent', continent: 'Europe' });
  assert.deepEqual([state.compared, state.continent], [[], 'Europe'], 'goToLevel applies it');
});

test('View C keeps the list, opens only with entities and returns to the level it was opened from', () => {
  reset({ level: 'continent', continent: 'Europe', compared: ['PRT', 'ESP'] });
  st.openCompare();
  assert.equal(state.level, 'compare');
  st.toggleCompared('ITA');
  assert.deepEqual(state.compared, ['PRT', 'ESP', 'ITA']);
  st.closeCompare();
  assert.deepEqual([state.level, state.continent, state.compared], ['continent', 'Europe', ['PRT', 'ESP', 'ITA']]);
  reset({ compared: ['Asia'] });
  st.openCompare();
  assert.equal(state.compareFrom, 'world');
  st.closeCompare();
  assert.equal(state.level, 'world');
  reset();
  st.openCompare();
  assert.equal(state.level, 'world', 'an empty list does not open View C');
});

test('removing countries leaves View C at one remaining country and preserves the origin', () => {
  reset({ level: 'continent', continent: 'Europe', compared: ['PRT', 'ESP', 'DEU'], year: 2024, rangeStart: 2000 });
  st.openCompare();
  st.toggleCompared('DEU');
  assert.equal(state.level, 'compare', 'two countries still have a comparison');
  st.setState({ hovered: 'ESP' });
  st.toggleCompared('ESP');
  assert.equal(state.level, 'continent');
  assert.equal(state.continent, 'Europe');
  assert.deepEqual(state.compared, ['PRT']);
  assert.equal(state.hovered, null);
  assert.deepEqual([state.year, state.rangeStart], [2024, 2000]);
});

test('removing the last country or clearing countries also returns to the origin', () => {
  reset({ level: 'continent', continent: 'Europe', compared: ['PRT'] });
  st.openCompare();
  st.toggleCompared('PRT');
  assert.equal(state.level, 'continent');
  assert.deepEqual(state.compared, []);
  reset({ level: 'continent', continent: 'Europe', compared: ['PRT', 'ESP'] });
  st.openCompare();
  st.setState({ compared: [], brush: null, hovered: null });
  assert.equal(state.level, 'continent');
  assert.deepEqual(state.compared, []);
});

test('removing a country outside View C and removing a continent keep their existing navigation', () => {
  reset({ level: 'continent', continent: 'Europe', compared: ['PRT', 'ESP'] });
  st.toggleCompared('ESP');
  assert.equal(state.level, 'continent');
  assert.deepEqual(state.compared, ['PRT']);
  reset({ compared: ['Asia', 'Europe'] });
  st.openCompare();
  st.toggleCompared('Asia');
  assert.equal(state.level, 'compare');
  assert.deepEqual(state.compared, ['Europe']);
  st.closeCompare();
});

test('View C needs a year after the range start: opening it moves the start back', () => {
  reset({ compared: ['Asia'], year: 1995, rangeStart: 2000 });
  st.openCompare();
  assert.equal(state.rangeStart, 1994);
  st.closeCompare();
  reset({ compared: ['Asia'], year: 1985, rangeStart: 2000 });
  st.openCompare();
  assert.deepEqual([state.rangeStart, state.year], [1985, 1986]);
  st.closeCompare();
  reset({ compared: ['Asia'], year: 2024, rangeStart: 2000 });
  st.openCompare();
  assert.equal(state.rangeStart, 2000);
  st.closeCompare();
});

test('a compared country keeps its colour slot when another one leaves', () => {
  reset({ level: 'continent', continent: 'Europe', compared: ['PRT', 'ESP', 'DEU'] });
  const before = st.comparedSlot('DEU');
  st.toggleCompared('ESP');
  assert.equal(st.comparedSlot('DEU'), before);
  st.toggleCompared('FRA');
  assert.equal(st.comparedSlot('FRA'), 1, 'a new country takes the lowest free slot');
});

// Why CO₂e changed (LMDI decomposition) and clean vs total

test('decomposition: baseline is zero; constant intensity attributes the change to generation', () => {
  assert.deepEqual(decomposeEmissions(base, base), { demand: 0, mix: 0, net: 0 });
  const result = decomposeEmissions(base, { generation: 200, emissions: 100 });
  near(result.demand, 50);
  near(result.mix, 0);
});

test('decomposition: constant generation attributes the change to the mix, including equal emissions', () => {
  assert.deepEqual(decomposeEmissions(base, { generation: 100, emissions: 25 }), { demand: 0, mix: -25, net: -25 });
  const result = decomposeEmissions(base, { generation: 200, emissions: 50 });
  near(result.demand, 50 * Math.log(2));
  near(result.demand + result.mix, 0);
});

test('decomposition: missing data stays missing; zero emissions uses the LMDI limit', () => {
  assert.equal(decomposeEmissions(base, { generation: 100, emissions: null }), null);
  assert.equal(decomposeEmissions(base, { generation: 0, emissions: 0 }), null);
  assert.deepEqual(decomposeEmissions(base, { generation: 200, emissions: 0 }), { demand: 0, mix: -50, net: -50 });
});

test('clean vs total rows preserve gaps and a missing baseline; reversed ranges are empty', () => {
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

test('T6 and findings: Portugal cut CO₂e by changing how it makes electricity; China grew by making more', () => {
  const { byCountry } = realData();
  const prt = decomposeEmissions(at(byCountry, 'PRT', 2000), at(byCountry, 'PRT', 2024));
  assert.ok(prt.mix < 0 && Math.abs(prt.mix) > Math.abs(prt.demand));
  near(prt.demand + prt.mix, prt.net);
  assert.ok(at(byCountry, 'PRT', 2024).emissions / at(byCountry, 'PRT', 2000).emissions < 0.25, 'about −80%');
  const chn = decomposeEmissions(at(byCountry, 'CHN', 2000), at(byCountry, 'CHN', 2024));
  assert.ok(chn.demand > 0 && chn.demand > Math.abs(chn.mix));
  assert.ok(at(byCountry, 'CHN', 2024).emissions / at(byCountry, 'CHN', 2000).emissions > 5, 'fivefold');
});


// Cards follow the active chart, including keyboard-pinned readings.
test('comparison cards contain only the active chart data', async () => {
  const { comparisonTooltip } = await import('../src/js/charts/compareTooltip.js');
  const entity = {
    name: 'Portugal',
    mix: [{ year: 2024, gas: 100, wind: 200, hydro: 300, total: 600 }],
    growth: [{ year: 2024, generation: 10, lowCarbon: 15, effects: { demand: 2, mix: -7, net: -5 } }],
  };
  const mix = comparisonTooltip(entity, 'mix', 2024, 2000);
  assert.match(mix, /Portugal, 2024/);
  assert.match(mix, /Made of \(kWh per person\)/);
  assert.match(mix, /Hydro/);
  assert.doesNotMatch(mix, /Clean vs total|Why CO₂e changed|TWh|MtCO₂e/);

  const race = comparisonTooltip(entity, 'race', 2024, 2000);
  assert.match(race, /Clean vs total, since 2000/);
  assert.match(race, /Total generation/);
  assert.match(race, /Clean ahead by/);
  assert.match(race, /5.0 TWh/);
  assert.doesNotMatch(race, /Made of|Hydro|Why CO₂e changed|MtCO₂e/);

  const effects = comparisonTooltip(entity, 'effects', 2024, 2000, true);
  assert.match(effects, /Why CO₂e changed, since 2000/);
  assert.match(effects, /Total change/);
  assert.ok(effects.includes("−5.0 MtCO₂e"));
  assert.match(effects, /Pinned/);
  assert.doesNotMatch(effects, /Made of|Clean vs total|Total generation|TWh/);
  assert.doesNotMatch(race, /Pinned/);
});

test('chart-specific cards preserve missing data and negative gaps', async () => {
  const { comparisonTooltip } = await import('../src/js/charts/compareTooltip.js');
  const entity = { name: 'Europe', mix: [], growth: [{ year: 2024, generation: 15, lowCarbon: 10, effects: null }] };
  const race = comparisonTooltip(entity, 'race', 2024, 2000);
  assert.match(race, /Clean behind by/);
  assert.match(race, /5.0 TWh/);
  assert.match(comparisonTooltip(entity, 'effects', 2024, 2000), /No data/);
  assert.doesNotMatch(comparisonTooltip(entity, 'effects', 2024, 2000), /Clean behind by/);
  assert.match(comparisonTooltip(entity, 'mix', 2001, 2000), /No data/);
});
