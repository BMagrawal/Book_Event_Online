import { supabaseAdmin } from "@/lib/supabase";
import { generateContentHash, type ScrapedEvent } from "./base";
import { scrapeEventbrite } from "./eventbrite";
import { scrapeTimeoutSydney } from "./timeout";
import { scrapeCouncilSydney } from "./council";
import { scrapeBroadsheet } from "./broadsheet";
import { generateSeedEvents } from "./seed";

export interface ScrapeResult {
  source_name: string;
  events_found: number;
  events_new: number;
  events_updated: number;
  events_inactive: number;
  error?: string;
}

async function upsertEvent(event: ScrapedEvent): Promise<"new" | "updated" | "unchanged"> {
  const hash = generateContentHash({
    title: event.title,
    date_time: event.date_time,
    venue_name: event.venue_name,
    venue_address: event.venue_address,
    description: event.description,
  });

  // Check if event already exists by URL
  const { data: existing } = await supabaseAdmin
    .from("events")
    .select("id, content_hash, status")
    .eq("original_event_url", event.original_event_url)
    .maybeSingle();

  if (!existing) {
    // Insert new event
    const { error } = await supabaseAdmin.from("events").insert({
      ...event,
      status: "new",
      content_hash: hash,
      last_scraped_at: new Date().toISOString(),
    });
    if (error) console.error("Insert error:", error.message);
    return "new";
  }

  // Update last_scraped_at always
  const isChanged = existing.content_hash !== hash;
  const newStatus = existing.status === "imported"
    ? "imported"
    : isChanged
    ? "updated"
    : existing.status;

  const { error } = await supabaseAdmin
    .from("events")
    .update({
      ...event,
      content_hash: hash,
      status: newStatus,
      last_scraped_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);

  if (error) console.error("Update error:", error.message);
  return isChanged ? "updated" : "unchanged";
}

async function markInactiveEvents(sourceUrl: string, activeUrls: string[]): Promise<number> {
  if (activeUrls.length === 0) return 0;

  // Get all events from this source
  const { data: allSourceEvents } = await supabaseAdmin
    .from("events")
    .select("id, original_event_url, status")
    .eq("source_url", sourceUrl)
    .neq("status", "inactive");

  if (!allSourceEvents) return 0;

  const toDeactivate = allSourceEvents.filter(
    (e) => !activeUrls.includes(e.original_event_url)
  );

  if (toDeactivate.length === 0) return 0;

  const ids = toDeactivate.map((e) => e.id);
  await supabaseAdmin
    .from("events")
    .update({ status: "inactive", updated_at: new Date().toISOString() })
    .in("id", ids);

  return toDeactivate.length;
}

async function runScraperWithLog(
  name: string,
  scraper: () => Promise<ScrapedEvent[]>
): Promise<ScrapeResult> {
  // Create scrape log
  const { data: log } = await supabaseAdmin
    .from("scrape_logs")
    .insert({ source_name: name, started_at: new Date().toISOString() })
    .select()
    .single();

  const result: ScrapeResult = {
    source_name: name,
    events_found: 0,
    events_new: 0,
    events_updated: 0,
    events_inactive: 0,
  };

  try {
    const events = await scraper();
    result.events_found = events.length;

    const activeUrls: string[] = [];

    for (const event of events) {
      if (!event.title || !event.original_event_url) continue;
      activeUrls.push(event.original_event_url);
      const outcome = await upsertEvent(event);
      if (outcome === "new") result.events_new++;
      else if (outcome === "updated") result.events_updated++;
    }

    if (events.length > 0) {
      result.events_inactive = await markInactiveEvents(
        events[0].source_url,
        activeUrls
      );
    }

    // Update log success
    if (log) {
      await supabaseAdmin
        .from("scrape_logs")
        .update({
          finished_at: new Date().toISOString(),
          events_found: result.events_found,
          events_new: result.events_new,
          events_updated: result.events_updated,
          events_inactive: result.events_inactive,
          status: "success",
        })
        .eq("id", log.id);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.error = msg;
    console.error(`[${name}] Error:`, msg);

    if (log) {
      await supabaseAdmin
        .from("scrape_logs")
        .update({
          finished_at: new Date().toISOString(),
          status: "error",
          error_message: msg,
        })
        .eq("id", log.id);
    }
  }

  return result;
}

export async function runAllScrapers(): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = [];

  // Always seed first to ensure DB has data
  const seedResult = await runScraperWithLog("Sydney Events Hub", async () =>
    generateSeedEvents()
  );
  results.push(seedResult);

  // Real scrapers
  const scrapers: [string, () => Promise<ScrapedEvent[]>][] = [
    ["Eventbrite", scrapeEventbrite],
    ["Timeout Sydney", scrapeTimeoutSydney],
    ["City of Sydney", scrapeCouncilSydney],
    ["Broadsheet Sydney", scrapeBroadsheet],
  ];

  for (const [name, scraper] of scrapers) {
    const r = await runScraperWithLog(name, scraper);
    results.push(r);
  }

  return results;
}

export async function runSingleScraper(sourceName: string): Promise<ScrapeResult> {
  const scraperMap: Record<string, () => Promise<ScrapedEvent[]>> = {
    "Sydney Events Hub": async () => generateSeedEvents(),
    Eventbrite: scrapeEventbrite,
    "Timeout Sydney": scrapeTimeoutSydney,
    "City of Sydney": scrapeCouncilSydney,
    "Broadsheet Sydney": scrapeBroadsheet,
  };

  const scraper = scraperMap[sourceName];
  if (!scraper) {
    return { source_name: sourceName, events_found: 0, events_new: 0, events_updated: 0, events_inactive: 0, error: "Unknown source" };
  }

  return runScraperWithLog(sourceName, scraper);
}
