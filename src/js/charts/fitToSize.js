// Draws a chart at the svg's real size in CSS pixels, now and whenever the panel changes size,
// so text keeps its size instead of shrinking with a fixed viewBox.

export function fitToSize(svg, draw) {
  new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    if (width === 0 || height === 0) return;
    svg.attr("viewBox", `0 0 ${width} ${height}`);
    draw(width, height);
  }).observe(svg.node());
}
