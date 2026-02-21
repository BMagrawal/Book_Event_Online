import crypto from "crypto";

export function generateContentHash(data: {
  title: string;
  date_time?: string | null;
  venue_name?: string | null;
  venue_address?: string | null;
  description?: string | null;
}): string {
  const str = [
    data.title,
    data.date_time ?? "",
    data.venue_name ?? "",
    data.venue_address ?? "",
    data.description ?? "",
  ]
    .join("|")
    .toLowerCase()
    .trim();
  return crypto.createHash("md5").update(str).digest("hex");
}

export interface ScrapedEvent {
  title: string;
  date_time: string | null;
  date_time_end: string | null;
  venue_name: string | null;
  venue_address: string | null;
  city: string;
  description: string | null;
  category: string | null;
  tags: string[] | null;
  image_url: string | null;
  source_name: string;
  source_url: string;
  original_event_url: string;
}
