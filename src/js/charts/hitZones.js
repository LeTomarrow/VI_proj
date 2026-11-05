// Hover zones for thin marks: each zone is at least `min` pixels wide, taking room from its
// wider neighbours. Intervals are [start, end] in pixels, sorted and touching or close.

export function hitZones(intervals, min) {
  const zones = intervals.map(([a, b]) => [a, b]);
  const center = ([a, b]) => (a + b) / 2;
  const thin = ([a, b]) => b - a < min;

  for (let i = 0; i < intervals.length - 1; i++) {
    const [left, right] = [intervals[i], intervals[i + 1]];
    let edge = right[0];
    if (thin(right)) edge = Math.min(edge, center(right) - min / 2);
    if (thin(left)) edge = Math.max(edge, center(left) + min / 2);
    edge = Math.max(center(left), Math.min(center(right), edge));
    zones[i][1] = edge;
    zones[i + 1][0] = edge;
  }
  if (zones.length) {
    zones[0][0] = Math.min(zones[0][0], center(intervals[0]) - min / 2);
    zones.at(-1)[1] = Math.max(zones.at(-1)[1], center(intervals.at(-1)) + min / 2);
  }
  return zones;
}

export function zoneAt(zones, position) {
  return zones.findIndex(([a, b]) => position >= a && position < b);
}
