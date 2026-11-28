// Chart titles: what the chart shows, then its context (where and when) in a lighter weight on
// the same line, so the subject reads first and a year change only changes the quiet part.

export function titleWith(selector, main, context) {
  const title = d3.select(selector).text(null);
  title.append("span").text(main);
  title.append("span").attr("class", "title-context").text(` ${context}`);
}
