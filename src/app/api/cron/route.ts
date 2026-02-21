import { NextRequest, NextResponse } from "next/server";

// This route is called by Vercel Cron or external cron service
// Configure in vercel.json or call from external scheduler
export async function GET(request: NextRequest) {
  // Verify cron secret if set
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { runAllScrapers } = await import("@/lib/lib/engine");
    const results = await runAllScrapers();

    const summary = results.map((r) => ({
      source: r.source_name,
      found: r.events_found,
      new: r.events_new,
      updated: r.events_updated,
      inactive: r.events_inactive,
      error: r.error,
    }));

    console.log("[Cron] Scrape completed:", JSON.stringify(summary));

    return NextResponse.json({
      success: true,
      ran_at: new Date().toISOString(),
      summary,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Cron] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
