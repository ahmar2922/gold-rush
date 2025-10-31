import { prisma } from "./db";

type Row = { ts: Date; value: number };

export async function upsertSeries(code: string, desc: string, source: string, rows: Row[]) {
  await prisma.seriesMeta.upsert({
    where: { code },
    update: { description: desc, source },
    create: { code, description: desc, source }
  });
  for (const r of rows) {
    await prisma.seriesValue.upsert({
      where: { code_ts: { code, ts: r.ts } },
      update: { value: r.value },
      create: { code, ts: r.ts, value: r.value }
    });
  }
}
