import { zFrom, clamp } from "./math";

type Row = { ts: Date; value: number };
type SeriesMap = Record<string, Row[]>;

export async function computeSignals(data: SeriesMap) {
  const gold = data["GOLDAMGBD228NLBM"];
  const usd  = data["DTWEXBGS"];
  const tips = data["DFII10"];
  const vix  = data["VIXCLS"];
  const hy   = data["BAMLH0A0HYM2"];

  const toMap = (rows: Row[]) => new Map(rows.map(r => [r.ts.toISOString().slice(0,10), r.value]));
  const mGold = toMap(gold), mUsd = toMap(usd), mTips = toMap(tips), mVix = toMap(vix), mHy = toMap(hy);

  const rows: { ts: Date; gold: number; usd?: number; tips?: number; vix?: number; hy?: number }[] = [];
  for (const r of gold) {
    const d = r.ts.toISOString().slice(0,10);
    rows.push({ ts: r.ts, gold: r.value, usd: mUsd.get(d), tips: mTips.get(d), vix: mVix.get(d), hy: mHy.get(d) });
  }

  const ffill = (arr: (number|undefined)[]) => {
    let last: number | undefined;
    return arr.map(v => (v === undefined ? (last ?? 0) : (last = v)));
  };

  const goldArr = rows.map(r => r.gold);
  const usdArr  = ffill(rows.map(r => r.usd));
  const tipsArr = ffill(rows.map(r => r.tips));
  const vixArr  = ffill(rows.map(r => r.vix));
  const hyArr   = ffill(rows.map(r => r.hy));

  const tipsZ = zFrom(tipsArr);       // higher real = bad (negate)
  const usdZ  = zFrom(usdArr);        // stronger USD = bad (negate)
  const vixZ  = zFrom(vixArr);        // stress = supportive
  const hyZ   = zFrom(hyArr);         // stress = supportive
  const stressZ = vixZ.map((v, i) => (v + hyZ[i]) / 2);

  const ma = (A: number[], w: number, i: number) => {
    const s = Math.max(0, i - w + 1);
    const seg = A.slice(s, i + 1);
    return seg.reduce((a,b)=>a+b,0)/seg.length;
  };
  const i = goldArr.length - 1;
  const regime = goldArr[i] > ma(goldArr, 200, i) ? "bull" : "bear";

  const rrs = -tipsZ[i];
  const dxys = -usdZ[i];
  const stress = stressZ[i];

  const w1=0.45, w2=0.25, w4=0.30;
  let gcs = w1*rrs + w2*dxys + w4*stress;
  gcs = regime === "bear" ? gcs * 0.8 : gcs * 1.05;

  let recommendation: "BUY"|"HOLD"|"SELL" = "HOLD";
  if (gcs >= 0.75) recommendation = "BUY";
  if (gcs <= -0.75) recommendation = "SELL";

  const confidence = clamp(Math.abs(gcs)/3, 0.5, 0.9);

  return {
    ts: rows[i].ts,
    gcs, regime, recommendation, confidence,
    breakdown: { real_rate_z: rrs, usd_z: dxys, stress_z: stress, weights: { real_rate: w1, usd: w2, stress: w4 } }
  };
}
