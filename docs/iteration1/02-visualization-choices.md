# 1st Iteration — Visualisation Technique Choices

> Covers: "Justified choice of the visualisation techniques selected (for representation,
> presentation, and interaction)."

The application has four linked views. They share the selected **year**, **metric** and
**country**. When no country is selected, Views 3 and 4 show the World.

The design follows Shneiderman's mantra: *overview first, zoom and filter, then details on
demand*.

| Mantra step | Where it happens |
|---|---|
| Overview | View 1 (globe), opened on 2024 with the renewable share of electricity |
| Zoom / filter | Year slider and play button, metric selector, brushing in View 2, legend filtering in View 3 |
| Details on demand | Tooltips, and Views 3 and 4 for the selected country |
| Relate | View 4 compares a country's path with the World's; brushing in View 2 highlights on the globe |
| History | Play button replays the years; View 4 shows a country's whole path over time |

## View 1 - Rotating globe

- **Question(s) answered:** Where and when has electricity become greener?
- **Representation:** orthographic globe coloured as a choropleth by the selected metric:
  renewable share (default), fossil share or carbon intensity. Countries without data are grey.
- **Presentation:** largest view on the screen, with a colour legend, a year slider with a play
  button, and a coverage indicator ("Data available: 196 / 214 countries"). Colour scales are
  fixed across years, so a colour change always means a change in the data.
- **Interaction:** drag to rotate; slider and play to change the year; hover for a tooltip;
  click to select a country (the globe rotates to it); search box for small countries; a
  **Globe / Flat map** toggle switches to a world map (Equal Earth projection) with an animated
  transition. The selected year, metric and country are kept when switching.
- **Why this technique:** a map is the natural overview of per-country data, and a globe is
  more engaging than the flat map OWID already provides. Only half the world is visible at
  once, which rotation and the search box compensate for. Users who find the globe hard to use,
  or who want to see every country at once, can switch to the flat map. Equal Earth keeps
  country areas proportional, so large high-latitude countries (Russia, Canada) are not
  exaggerated as they would be with Mercator.

## View 2 - Emissions bubble scatter

- **Question(s) answered:** Who pollutes the most, and by which measure?
- **Representation:** one bubble per country for the selected year. x = emissions per capita
  (log scale), y = carbon intensity, area = total emissions, colour = same metric as the globe.
- **Presentation:** axes with units, labels only for the largest emitters and the selected
  country, dashed lines at the World's values. A notice is shown for years before 2000, when
  there is no emissions data.
- **Interaction:** hover for a tooltip; click to select a country; brush to select a group,
  which is highlighted on the globe; bubbles move smoothly when the year changes.
- **Why this technique:** a bar chart ranks countries by one measure only. The scatter shows
  three measures at once, so it reveals that the rankings disagree (e.g. China emits the most
  in total, but not per person).

## View 3 - Electricity mix (stacked areas)

- **Question(s) answered:** What is a country's electricity made of, and how has it changed?
- **Representation:** stacked area chart of generation by source over time (1985–2025). Fossil
  sources at the bottom in warm colours, low-carbon sources on top in cool/green colours.
- **Presentation:** a vertical line marks the selected year; toggle between TWh and % of
  generation.
- **Interaction:** hover shows all source values for a year; clicking a legend item isolates
  that source; clicking the chart sets the year.
- **Why this technique:** stacked areas show both the total and the share of each source over
  time. Putting fossil sources at the bottom makes the fossil / low-carbon split easy to read.

## View 4 - Greener vs. cleaner (connected scatterplot)

- **Question(s) answered:** Is green growth keeping up with demand? Which countries go against
  the trend?
- **Representation:** one point per year, connected in time order. x = renewable share,
  y = emissions from electricity. The selected country is in colour, the World in grey.
- **Presentation:** first and last years labelled, arrows showing the direction of time, the
  selected year highlighted. Moving right and down means *greener and cleaner*; right and up
  means *greener, but not cleaner*.
- **Interaction:** hover for year and values; click a point to set the year; switch the y axis
  between total emissions and carbon intensity.
- **Why this technique:** it shows the relation between two variables over time in a single
  chart, instead of comparing two line charts. It is less common and can be harder to read
  (Haroz et al., 2016), so the year labels and arrows will be checked in the usability tests.

## Cross-view interaction

- **Year** (slider, play, or click in View 3/4) updates every view.
- **Country** (click on the globe or a bubble, or search) is highlighted in Views 1 and 2 and
  shown in Views 3 and 4.
- **Brushing** in View 2 highlights the selected countries on the globe.
- **Hovering** a country in View 1 or 2 highlights it in the other.
