export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { fetchAllFred } from "@/lib/fetchers";
import { computeSignals } from "@/lib/signals";
import { upsertSeries } from "@/lib/save";
import { prisma } from "@/lib/db";
import axios from "axios";

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

async function sendEmail(subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  const toEmail = process.env.ALERT_EMAIL;
  if (!key || !toEmail) return;
  try {
    await axios.post(
      "https://api.resend.com/emails",
      {
        from: "Gold Bot <onboarding@resend.dev>",
        to: [toEmail],
        subject,
        html,
      },
      { headers: { Authorization: `Bearer ${key}` } }
    );
  } catch (e) {
    console.error("email error", e);
  }
}

async function sendTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await axios.get(`https://api.telegram.org/bot${token}/sendMessage`, {
      params: { chat_id: chatId, text, parse_mode: "HTML" },
    });
  } catch (e) {
    console.error("telegram error", e);
  }
}

export async function GET() {
  if (isBuildPhase) {
    return NextResponse.json({ ok: true, skipped: "build" });
  }

  const fred = await fetchAllFred();

  await upsertSeries("DFII10", "US 10Y TIPS", "FRED", fred["DFII10"]);
  await upsertSeries("DTWEXBGS", "USD broad", "FRED", fred["DTWEXBGS"]);
  await upsertSeries("GOLDAMGBD228NLBM", "Gold USD London AM", "FRED", fred["GOLDAMGBD228NLBM"]);
  await upsertSeries("VIXCLS", "VIX", "FRED", fred["VIXCLS"]);
  await upsertSeries("BAMLH0A0HYM2", "HY OAS", "FRED", fred["BAMLH0A0HYM2"]);

  const rec = await computeSignals(fred);

  await prisma.gcsDaily.upsert({
    where: { ts: rec.ts },
    update: {
      gcs: rec.gcs,
      regime: rec.regime,
      recommendation: rec.recommendation,
      confidence: rec.confidence,
      explanation: rec.breakdown as any,
    },
    create: {
      ts: rec.ts,
      gcs: rec.gcs,
      regime: rec.regime,
      recommendation: rec.recommendation,
      confidence: rec.confidence,
      explanation: rec.breakdown as any,
    },
  });

  const subject = `Gold ${rec.recommendation} — GCS ${rec.gcs.toFixed(2)} (${rec.regime})`;
  const bodyShort = `Gold: ${rec.recommendation}\nGCS: ${rec.gcs.toFixed(2)}\nRegime: ${rec.regime}\nConfidence: ${(rec.confidence * 100).toFixed(0)}%`;
  const bodyHtml = `<h2>${rec.recommendation}</h2><p>GCS: ${rec.gcs.toFixed(2)}</p><p>Regime: ${rec.regime}</p><p>Confidence: ${(rec.confidence * 100).toFixed(0)}%</p>`;

  await sendEmail(subject, bodyHtml);
  await sendTelegram(`<b>${subject}</b>\n${bodyShort}`);

  return NextResponse.json({ ok: true, rec });
}
