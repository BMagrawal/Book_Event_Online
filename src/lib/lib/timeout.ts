import axios from "axios";
import * as cheerio from "cheerio";
import type { ScrapedEvent } from "./base";

const SOURCE_NAME = "Timeout Sydney";
const SOURCE_URL = "https://www.timeout.com/sydney/events";

export async function scrapeTimeoutSydney(): Promise<ScrapedEvent[]> {
  const events: ScrapedEvent[] = [];

  try {
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-AU,en;q=0.9",
    };

    const response = await axios.get(SOURCE_URL, { headers, timeout: 15000 });
    const $ = cheerio.load(response.data);

    // Timeout event article cards
    $("article, .card, [class*='articleCard'], [class*='tile']").each((_, el) => {
      try {
        const card = $(el);

        const titleEl = card.find("h2, h3, h4, [class*='title'], [class*='heading']").first();
        const title = titleEl.text().trim();
        if (!title || title.length < 3) return;

        const linkEl = card.find("a[href]").first();
        const href = linkEl.attr("href") || "";
        if (!href) return;
        const eventUrl = href.startsWith("http") ? href : `https://www.timeout.com${href}`;

        const dateEl = card.find("time, [class*='date'], [class*='when']").first();
        const dateText = dateEl.attr("datetime") || dateEl.text().trim() || null;

        const venueEl = card.find("[class*='venue'], [class*='location'], [class*='where']").first();
        const venue = venueEl.text().trim() || null;

        const descEl = card.find("p, [class*='desc'], [class*='summary']").first();
        const description = descEl.text().trim() || null;

        const imgEl = card.find("img").first();
        const imageUrl =
          imgEl.attr("src") ||
          imgEl.attr("data-src") ||
          imgEl.attr("data-lazy-src") ||
          null;

        const catEl = card.find("[class*='category'], [class*='tag'], [class*='label']").first();
        const category = catEl.text().trim() || "Events";

        if (title && eventUrl && !eventUrl.includes("timeout.com/sydney/events")) {
          events.push({
            title,
            date_time: dateText,
            date_time_end: null,
            venue_name: venue,
            venue_address: venue,
            city: "Sydney",
            description,
            category,
            tags: [category],
            image_url: imageUrl,
            source_name: SOURCE_NAME,
            source_url: SOURCE_URL,
            original_event_url: eventUrl,
          });
        }
      } catch {
        // skip
      }
    });

    // JSON-LD fallback
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || "{}");
        const items = Array.isArray(json) ? json : [json];
        for (const item of items) {
          if (item["@type"] === "Event" && item.name) {
            const existingUrl = item.url || "";
            if (events.some((e) => e.original_event_url === existingUrl)) continue;

            events.push({
              title: item.name,
              date_time: item.startDate || null,
              date_time_end: item.endDate || null,
              venue_name: item.location?.name || null,
              venue_address: item.location?.address?.streetAddress || null,
              city: "Sydney",
              description: item.description || null,
              category: "Events",
              tags: ["Events"],
              image_url: typeof item.image === "string" ? item.image : item.image?.[0] || null,
              source_name: SOURCE_NAME,
              source_url: SOURCE_URL,
              original_event_url: item.url || SOURCE_URL,
            });
          }
        }
      } catch {
        // skip
      }
    });
  } catch (err) {
    console.error("[Timeout Sydney] Scrape error:", err instanceof Error ? err.message : err);
  }

  return events;
}
