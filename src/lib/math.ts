export function rollingMean(values: number[], window: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    out.push(slice.reduce((a,b)=>a+b,0)/slice.length);
  }
  return out;
}

export function rollingStd(values: number[], window: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    const mean = slice.reduce((a,b)=>a+b,0)/slice.length;
    const varc = slice.reduce((a,b)=>a+(b-mean)**2,0)/slice.length;
    out.push(Math.sqrt(varc));
  }
  return out;
}

export function zFrom(values: number[], window = 120) {
  const mu = rollingMean(values, window);
  const sd = rollingStd(values, window);
  return values.map((v, i) => (sd[i] ? (v - mu[i]) / sd[i] : 0));
}

export function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
