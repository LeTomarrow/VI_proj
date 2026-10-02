const DATA_URL = "../data/owid-energy-data.csv";

// TODO: narrow to the columns the app actually uses once the view designs are final —
// the full file has 130 columns and loading all of them client-side is wasteful.
export async function loadEnergyData() {
  const raw = await d3.csv(DATA_URL, d3.autoType);
  return raw;
}
