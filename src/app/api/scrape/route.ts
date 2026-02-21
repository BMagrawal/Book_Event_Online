import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  // Only authenticated users can trigger scrapes
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const source = body.source as string | undefined;

    const { runAllScrapers, runSingleScraper } = await import("@/lib/lib/engine");

    let results;
    if (source) {
      const result = await runSingleScraper(source);
      results = [result];
    } else {
      results = await runAllScrapers();
    }

    return NextResponse.json({ success: true, results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  // Return recent scrape logs
  const { data, error } = await supabaseAdmin
    .from("scrape_logs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs: data });
}
