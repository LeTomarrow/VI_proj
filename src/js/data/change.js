import { CONTINENTS } from "./constants.js";

// Change of each country between two years, for View B's sorted bars (task T2: did the renewable
// share rise, and did emissions fall?).
//   renewable: change in renewable share (pp)
//   emissions: change in emissions from electricity (% of the start year), null without data

const share = (r) => r?.renewableShare ?? null;

export function changeRows(keys, byCountry, start, end) {
  if (end <= start) return [];
  return keys.map((key) => {
    const r0 = byCountry.get(key)?.get(start);
    const r1 = byCountry.get(key)?.get(end);
    const from = share(r0);
    const to = share(r1);
    if (from === null || to === null) return null;
    const e0 = r0.emissions;
    const e1 = r1.emissions;
    const emissions = e0 > 0 && e1 !== null ? (100 * (e1 - e0)) / e0 : null;
    return { key, name: r1.name ?? key, from, to, renewable: to - from, e0, e1, emissions };
  }).filter(Boolean).sort((a, b) => b.renewable - a.renewable);
}


// The continent stays the scope; an active country comparison narrows the displayed rows.
export function changeCountryKeys(keys, compared = [], brushed = null) {
  const countries = compared.filter((key) => !CONTINENTS.includes(key));
  return countries.length ? keys.filter((key) => countries.includes(key) || !!brushed?.has(key)) : keys;
}
