import axios from "axios";
import * as cheerio from "cheerio";
import type { ScrapedEvent } from "./base";

const SOURCE_NAME = "Eventbrite";
const SOURCE_URL = "https://www.eventbrite.com.au/d/australia--sydney/events/";

export async function scrapeEventbrite(): Promise<ScrapedEvent[]> {
  const events: ScrapedEvent[] = [];

  try {
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
    };

    const response = await axios.get(SOURCE_URL, { headers, timeout: 15000 });
    const $ = cheerio.load(response.data);

    // Eventbrite event cards
    $("[data-testid='event-card'], .discover-search-desktop-card, .eds-event-card-content").each((_, el) => {
      try {
        const card = $(el);

        const titleEl = card.find("h2, h3, [data-testid='event-card-title']").first();
        const title = titleEl.text().trim();
        if (!title) return;

        const linkEl = card.find("a").first();
        const href = linkEl.attr("href") || "";
        const eventUrl = href.startsWith("http") ? href : `https://www.eventbrite.com.au${href}`;

        const dateEl = card.find("time, [data-testid='event-card-date'], .eds-text-bs").first();
        const dateText = dateEl.attr("datetime") || dateEl.text().trim();

        const venueEl = card.find("[data-testid='event-card-venue'], .card-text--where").first();
        const venue = venueEl.text().trim();

        const descEl = card.find("p, .eds-text-bs--fixed").first();
        const description = descEl.text().trim();

        const imgEl = card.find("img").first();
        const imageUrl = imgEl.attr("src") || imgEl.attr("data-src") || null;

        const categoryEl = card.find("[data-testid='event-card-category']").first();
        const category = categoryEl.text().trim() || null;

        if (title && eventUrl && eventUrl !== SOURCE_URL) {
          events.push({
            title,
            date_time: dateText || null,
            date_time_end: null,
            venue_name: venue ? venue.split(",")[0].trim() : null,
            venue_address: venue || null,
            city: "Sydney",
            description: description || null,
            category,
            tags: category ? [category] : null,
            image_url: imageUrl,
            source_name: SOURCE_NAME,
            source_url: SOURCE_URL,
            original_event_url: eventUrl,
          });
        }
      } catch {
        // skip individual card errors
      }
    });

    // Also try JSON-LD structured data
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
              category: null,
              tags: null,
              image_url: item.image || null,
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
    console.error("[Eventbrite] Scrape error:", err instanceof Error ? err.message : err);
  }

  return events;
}
