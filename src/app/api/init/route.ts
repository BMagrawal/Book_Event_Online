import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  // Check if we already have events
  const { count } = await supabaseAdmin
    .from("events")
    .select("*", { count: "exact", head: true });

  if ((count || 0) > 0) {
    return NextResponse.json({ message: "Already initialized", count });
  }

  // Run seed scraper
  const { runSingleScraper } = await import("@/lib/lib/engine");
  const result = await runSingleScraper("Sydney Events Hub");

  return NextResponse.json({ message: "Initialized", result });
}
