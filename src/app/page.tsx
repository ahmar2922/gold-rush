"use client";
import useSWR from "swr";
import { format } from "date-fns";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function Home() {
  const { data: rec } = useSWR("/api/recommendation", fetcher, { refreshInterval: 30000 });

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Gold Rush — Daily Advisor</h1>
      {!rec?.ts ? (
        <div>No data yet. Visit <code>/api/cron/daily</code> once to populate.</div>
      ) : (
        <div className="p-4 rounded-2xl" style={{ background: "#fff", boxShadow: "0 1px 8px rgba(0,0,0,0.06)"}}>
          <div style={{ fontSize: 13, color: "#334155" }}>
            {format(new Date(rec.ts), "PPPP")}
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "baseline", marginTop: 6 }}>
            <div style={{
              fontSize: 28,
              fontWeight: 700,
              color: rec.recommendation === "BUY" ? "#16a34a" : rec.recommendation === "SELL" ? "#dc2626" : "#0f172a"
            }}>
              {rec.recommendation}
            </div>
            <div style={{ color: "#334155" }}>
              GCS {Number(rec.gcs).toFixed(2)} · {rec.regime} · {(Number(rec.confidence)*100).toFixed(0)}%
            </div>
          </div>
          <div style={{ fontSize: 14, color: "#334155", marginTop: 6 }}>
            <b>Breakdown</b>: real-rate z {rec.explanation?.real_rate_z?.toFixed?.(2)},
            &nbsp;USD z {rec.explanation?.usd_z?.toFixed?.(2)},
            &nbsp;stress z {rec.explanation?.stress_z?.toFixed?.(2)}
          </div>
          <p style={{ fontSize: 12, color: "#64748b", marginTop: 10 }}>
            Educational model only — not financial advice.
          </p>
        </div>
      )}
    </main>
  );
}
