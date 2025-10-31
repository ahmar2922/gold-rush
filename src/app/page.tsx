export const dynamic = "force-dynamic"; // never pre-render; always run on the server

import { format } from "date-fns";

type Rec = {
  ts: string | Date;
  gcs: number;
  regime: string;
  recommendation: "BUY" | "HOLD" | "SELL";
  confidence: number;
  explanation?: {
    real_rate_z?: number;
    usd_z?: number;
    stress_z?: number;
  };
} | null;

async function getRec(): Promise<Rec> {
  // Build an absolute URL that works on Vercel and locally
  const base =
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/recommendation`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as Rec;
  } catch {
    return null;
  }
}

export default async function Home() {
  const rec = await getRec();

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Gold Rush</h1>

      {!rec ? (
        <div>No data yet. Visit <code>/api/cron/daily</code> once to populate.</div>
      ) : (
        <div className="p-4 rounded-2xl" style={{ background: "#fff", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 13, color: "#334155" }}>
            {format(new Date(rec.ts), "PPPP")}
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "baseline", marginTop: 6 }}>
            <div style={{
              fontSize: 28, fontWeight: 700,
              color: rec.recommendation === "BUY" ? "#16a34a" :
                     rec.recommendation === "SELL" ? "#dc2626" : "#0f172a"
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
