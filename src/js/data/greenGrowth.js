// LMDI splits emissions = generation × intensity into two additive effects.
// Intensity is derived from the same emissions and generation, avoiding rounding residuals.
export function decomposeEmissions(base, record) {
  if (!(base?.generation > 0) || !(record?.generation > 0)
    || !Number.isFinite(base.emissions) || !Number.isFinite(record.emissions)
    || base.emissions < 0 || record.emissions < 0) return null;
  const net = record.emissions - base.emissions;
  if (base.emissions === 0 || record.emissions === 0) return { demand: 0, mix: net, net };
  const logRatio = Math.log(record.emissions / base.emissions);
  const mean = logRatio === 0 ? base.emissions : net / logRatio;
  const demand = mean * Math.log(record.generation / base.generation);
  return { demand, mix: net - demand, net };
}

export function greenGrowthRows(records, start, end) {
  const byYear = new Map(records.map((r) => [r.year, r]));
  const base = byYear.get(start);
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => {
    const year = start + i;
    const record = byYear.get(year);
    const race = base && record && Number.isFinite(base.generation) && Number.isFinite(record.generation)
      && Number.isFinite(base.lowCarbon) && Number.isFinite(record.lowCarbon);
    return {
      year,
      generation: race ? record.generation - base.generation : null,
      lowCarbon: race ? record.lowCarbon - base.lowCarbon : null,
      effects: decomposeEmissions(base, record),
    };
  });
}
