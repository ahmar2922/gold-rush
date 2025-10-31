import axios from "axios";
const FRED_API = "https://api.stlouisfed.org/fred/series/observations";

async function fredSeries(code: string) {
  const params = {
    series_id: code,
    file_type: "json",
    observation_start: "2000-01-01",
    api_key: process.env.FRED_API_KEY!
  };
  const { data } = await axios.get(FRED_API, { params });
  return data.observations
    .filter((o: any) => o.value !== "." && o.value !== "")
    .map((o: any) => ({ ts: new Date(o.date), value: parseFloat(o.value) }));
}

export async function fetchAllFred() {
  const series = ["DFII10", "DTWEXBGS", "GOLDAMGBD228NLBM", "VIXCLS", "BAMLH0A0HYM2"];
  const out: Record<string, { ts: Date; value: number }[]> = {};
  for (const code of series) out[code] = await fredSeries(code);
  return out;
}
