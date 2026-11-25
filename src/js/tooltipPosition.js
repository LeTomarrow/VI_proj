// Position a card beside a plot, independently of the pointer.
export function outsidePlotPosition(plot, card, viewport) {
  const gap = 10;
  const edge = 8;
  const spaces = [
    { side: 'above', height: plot.top - gap - edge, width: viewport.width - 2 * edge },
    { side: 'below', height: viewport.height - plot.bottom - gap - edge, width: viewport.width - 2 * edge },
    { side: 'right', width: viewport.width - plot.right - gap - edge, height: viewport.height - 2 * edge },
    { side: 'left', width: plot.left - gap - edge, height: viewport.height - 2 * edge },
  ];
  const space = spaces.find((s) => s.width >= card.width && s.height >= card.height)
    ?? spaces.reduce((best, s) => Math.min(s.width / card.width, s.height / card.height)
      > Math.min(best.width / card.width, best.height / card.height) ? s : best);
  const width = Math.min(card.width, Math.max(1, space.width));
  const height = Math.min(card.height, Math.max(1, space.height));
  const clamp = (v, max) => Math.max(edge, Math.min(v, max - edge));
  let x = clamp(plot.right - width, viewport.width - width);
  let y = space.side === 'above' ? plot.top - gap - height : plot.bottom + gap;
  if (space.side === 'right' || space.side === 'left') {
    x = space.side === 'right' ? plot.right + gap : plot.left - gap - width;
    y = clamp(plot.top, viewport.height - height);
  }
  return { x, y, maxWidth: Math.max(1, space.width), maxHeight: Math.max(1, space.height) };
}
