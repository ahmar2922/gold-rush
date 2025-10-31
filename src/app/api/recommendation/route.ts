import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const latest = await prisma.gcsDaily.findMany({ orderBy: { ts: "desc" }, take: 1 });
  return NextResponse.json(latest[0] ?? {});
}
