// View A (World): map metric values and colours, continent aggregation, Marimekko order,
// emissions chart; tasks T1-T2 on the real data. Also what surrounds the World view: the shared
// motion rule and the numbers of the landing and findings pages (SUS included).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { realData, record } from './helpers.mjs';

const { metricValue } = await import('../src/js/data/metrics.js');
const { METRICS, RANKS, metricColor, metricDomain, formatMetric, sourceOrder } = await import('../src/js/scales.js');
const { orderByRank } = await import('../src/js/data/countryColumns.js');
const { sumCountries, checkAgainstOwid } = await import('../src/js/data/aggregate.js');
const { sourceProfile } = await import('../src/js/data/compare.js');
const { CONTINENTS } = await import('../src/js/data/constants.js');
const { comparedContinents, isDimmed } = await import('../src/js/state.js');
const { motionKey, moves } = await import('../src/js/motion.js');
const { susScore, SUS_AVERAGE } = await import('../src/js/data/sus.js');

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);
const at = (byKey, key, year) => byKey.get(key).get(year);
const years = (values) => new Map(Object.entries(values).map(([y, v]) => [+y, v === null ? undefined : { renewableShare: v }]));

test('metric value: Year, Change and Range average', () => {
  const byYear = years({ 2000: 10, 2001: 20, 2002: 30 });
  const base = { metric: 'renewableShare', year: 2002, rangeStart: 2000 };
  assert.equal(metricValue(byYear, { ...base, mode: 'year' }).value, 30);
  assert.equal(metricValue(byYear, { ...base, mode: 'change' }).value, 20);
  assert.equal(metricValue(byYear, { ...base, mode: 'average' }).value, 20);
});

test('metric value: missing ends give no Change; an average needs half of the years', () => {
  const s = { metric: 'renewableShare', year: 2003, rangeStart: 2000 };
  assert.equal(metricValue(years({ 2000: null, 2003: 30 }), { ...s, mode: 'change' }).value, null);
  assert.equal(metricValue(years({ 2000: 10, 2003: 30 }), { ...s, mode: 'average' }).value, 20, '2 of 4 years');
  assert.equal(metricValue(years({ 2003: 30 }), { ...s, mode: 'average' }).value, null, '1 of 4 years');
});

test('map colour: in Change, blue always means cleaner', () => {
  const rgb = (c) => d3.color(c);
  const renewUp = rgb(metricColor('renewableShare', 'change')(20));
  const intensityDown = rgb(metricColor('carbonIntensity', 'change')(-200));
  assert.ok(renewUp.b > renewUp.r, 'more renewables is blue');
  assert.ok(intensityDown.b > intensityDown.r, 'less CO₂e per kWh is blue');
  const intensityUp = rgb(metricColor('carbonIntensity', 'change')(200));
  assert.ok(intensityUp.r > intensityUp.b, 'more CO₂e per kWh is red');
});

test('electricity per person is neither cleaner nor dirtier: its Change scale is not blue/red', () => {
  assert.equal(METRICS.generationPerCapita.cleanerIs, 0);
  const more = d3.color(metricColor('generationPerCapita', 'change')(3000));
  const blueRed = d3.color(d3.interpolateRdBu(1));
  assert.notEqual(more.formatHex(), blueRed.formatHex());
  assert.deepEqual(metricDomain('generationPerCapita', 'change'), [-3000, 3000]);
});

test('map metrics: no fossil share; sequential domains are fixed', () => {
  assert.deepEqual(Object.keys(METRICS), ['renewableShare', 'carbonIntensity', 'generationPerCapita']);
  assert.deepEqual(metricDomain('renewableShare', 'year'), [0, 100]);
  const c = metricColor('carbonIntensity', 'year');
  assert.equal(c(900), c(800), 'clamped at the end of the fixed domain');
});

test('values are formatted with their unit and thousands separators', () => {
  assert.equal(formatMetric('generationPerCapita', 'year', 9044.4), '9,044 kWh');
  assert.equal(formatMetric('renewableShare', 'change', 12.34), '+12.3 pp');
  assert.equal(formatMetric('carbonIntensity', 'year', 495.2), '495 gCO₂e/kWh');
});

test('Marimekko: columns follow the ranking, ↓ or ↑; ranked sources go to the base', () => {
  const records = [
    record({ key: 'Asia', coal: 50, hydro: 10 }),
    record({ key: 'Europe', coal: 10, gas: 40 }),
    record({ key: 'Africa', coal: 20 }),
  ];
  const coal = RANKS.find((r) => r.key === 'coal');
  assert.deepEqual(orderByRank(records, coal, 'desc').map((r) => r.key), ['Asia', 'Africa', 'Europe']);
  assert.deepEqual(orderByRank(records, coal, 'asc').map((r) => r.key), ['Europe', 'Africa', 'Asia']);
  const total = RANKS.find((r) => r.key === 'generation');
  assert.deepEqual(orderByRank(records, total).map((r) => r.key), ['Asia', 'Europe', 'Africa']);
  const lowCarbon = RANKS.find((r) => r.key === 'lowCarbon');
  assert.deepEqual(sourceOrder(lowCarbon).slice(0, 5).map((g) => g.key), ['nuclear', 'hydro', 'wind', 'solar', 'bioOther']);
  assert.equal(records.map((r) => r.key).join(), 'Asia,Europe,Africa', 'the input is not reordered');
});

test('a continent is the sum of its countries; shares are recomputed, never averaged', () => {
  const big = record({ key: 'BIG', coal: 90, hydro: 10, emissions: 90 });
  const small = record({ key: 'SMALL', hydro: 10, emissions: 0 });
  const sum = sumCountries({ key: 'Europe', name: 'Europe', continent: 'Europe' }, 2024, [big, small]);
  near(sum.generation, 110);
  near(sum.renewableShare, (100 * 20) / 110);
  near(sum.carbonIntensity, (1000 * 90) / 110);
  const missing = sumCountries({ key: 'Europe' }, 2024, [big, { ...small, emissions: null }]);
  assert.equal(missing.emissions, null, 'emissions only when every country reports them');
});

test('real data: continent sums match OWID within 1% for 2000-2024', () => {
  const { continents, owidContinents } = realData();
  assert.deepEqual(checkAgainstOwid(continents, owidContinents), []);
});

test('real data: every continent-year equals the sum of its countries', () => {
  const { continents, countries } = realData();
  const byContinentYear = d3.rollup(countries, (rows) => d3.sum(rows, (r) => r.generation), (r) => r.continent, (r) => r.year);
  for (const r of continents.filter((c) => c.year === 2024)) near(r.generation, byContinentYear.get(r.key).get(2024), 1e-6);
});

test('the emissions chart lists compared continents in stack order', () => {
  assert.deepEqual(comparedContinents({ compared: ['Oceania', 'Asia', 'Europe'] }), ['Asia', 'Europe', 'Oceania']);
});

test('fading: only while compared entities are shown; hovered and compared stay in full', () => {
  const s = { compared: ['Asia'], hovered: 'Europe' };
  assert.equal(isDimmed('Africa', s, ['Asia', 'Africa', 'Europe']), true);
  assert.equal(isDimmed('Asia', s, ['Asia', 'Africa']), false);
  assert.equal(isDimmed('Europe', s, ['Asia', 'Europe']), false);
  assert.equal(isDimmed('PRT', { compared: ['Asia'], hovered: null }, ['PRT', 'ESP']), false, 'a chart without compared entities does not fade');
});

test('motion: marks move when the data changes, never on hover', () => {
  const base = { year: 2024, rangeStart: 2000, mode: 'year', metric: 'renewableShare', level: 'world', compared: [], hovered: null };
  assert.equal(motionKey(base), motionKey({ ...base, hovered: 'Asia' }));
  assert.notEqual(motionKey(base), motionKey({ ...base, year: 2023 }));
  assert.notEqual(motionKey(base), motionKey({ ...base, mekkoSort: 'asc' }));
  assert.notEqual(motionKey(base), motionKey({ ...base, scatterMin: 10 }));
  assert.equal(moves({ animate: true }), true);
  assert.equal(moves({ animate: false }), false);
});

test('T1: Asia emits the most CO₂e from electricity in 2024; Oceania cut its CO₂e per kWh the most', () => {
  const { byContinent } = realData();
  const emissions = CONTINENTS.map((c) => [c, at(byContinent, c, 2024).emissions]).sort((a, b) => b[1] - a[1]);
  assert.equal(emissions[0][0], 'Asia');
  assert.ok(emissions[0][1] > 10000 && emissions[0][1] < 10600, `${emissions[0][1]} Mt ≈ 10.3 Gt`);
  const drop = CONTINENTS.map((c) => [c, at(byContinent, c, 2024).carbonIntensity - at(byContinent, c, 2000).carbonIntensity])
    .sort((a, b) => a[1] - b[1]);
  assert.equal(drop[0][0], 'Oceania');
  assert.deepEqual(drop.slice(1, 3).map(([c]) => c).sort(), ['Europe', 'North America']);
});

test('T2: Asia makes about half of its electricity from coal; Europe has no source above a quarter', () => {
  const { byContinent } = realData();
  const asia = sourceProfile(at(byContinent, 'Asia', 2024));
  const top = asia.reduce((a, b) => (b.share > a.share ? b : a));
  assert.equal(top.key, 'coal');
  assert.ok(top.share > 45 && top.share < 60, `${top.share}%`);
  const europe = sourceProfile(at(byContinent, 'Europe', 2024));
  assert.ok(europe.every((v) => v.share < 25), europe.map((v) => `${v.key} ${v.share.toFixed(1)}`).join(', '));
});

test('landing: data/summary.json matches the app\'s preprocessing (run npm run build:summary)', () => {
  const summary = JSON.parse(readFileSync('data/summary.json', 'utf8'));
  const { world, byContinent } = realData();
  const close = (a, b) => assert.ok(Math.abs(a - b) <= 0.051, `${a} ≈ ${b}`);
  for (const row of summary.world) {
    const r = world.find((w) => w.year === row.year);
    for (const k of ['generation', 'lowCarbon', 'emissions']) close(row[k], r[k]);
  }
  for (const c of ['Europe', 'Asia']) for (const row of summary.continents[c]) close(row.emissions, at(byContinent, c, row.year).emissions);
});

test('landing and findings: 19% → 32% renewable, ×2.0 generation, +81% CO₂e (World, 2000-2024)', () => {
  const { byWorld } = realData();
  const [a, b] = [byWorld.get(2000), byWorld.get(2024)];
  assert.equal(Math.round(a.renewableShare), 19);
  assert.equal(Math.round(b.renewableShare), 32);
  assert.equal((b.generation / a.generation).toFixed(1), '2.0');
  assert.equal(Math.round((100 * (b.emissions - a.emissions)) / a.emissions), 81);
});

test('SUS: odd items count up, even items count down, × 2.5; incomplete answers give no score', () => {
  assert.equal(susScore([3, 3, 3, 3, 3, 3, 3, 3, 3, 3]), 50);
  assert.equal(susScore([5, 1, 5, 1, 5, 1, 5, 1, 5, 1]), 100);
  assert.equal(susScore([1, 5, 1, 5, 1, 5, 1, 5, 1, 5]), 0);
  assert.equal(susScore([4, 2, 4, 2, 4, 2, 4, 2, 4, 2]), 75);
  assert.equal(SUS_AVERAGE, 68);
  assert.equal(susScore([3, 3, 3]), null);
  assert.equal(susScore([3, 3, 3, 3, 3, 3, 3, 3, 3, 6]), null);
  assert.equal(susScore(undefined), null);
});

test('data/sus-results.json is valid: every listed participant has a score', () => {
  const results = JSON.parse(readFileSync('data/sus-results.json', 'utf8'));
  assert.ok(Array.isArray(results.sus) && Array.isArray(results.heuristics));
  for (const p of results.sus) assert.notEqual(susScore(p.answers), null, p.id);
});
