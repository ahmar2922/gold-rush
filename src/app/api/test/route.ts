import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    fredKey: process.env.FRED_API_KEY || "NOT_FOUND"
  });
}
