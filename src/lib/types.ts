export type EventStatus = "new" | "updated" | "inactive" | "imported";

export interface Event {
  id: string;
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
  status: EventStatus;
  imported_at: string | null;
  imported_by: string | null;
  import_notes: string | null;
  last_scraped_at: string;
  content_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailLead {
  id: string;
  email: string;
  consent: boolean;
  event_id: string | null;
  event_title: string | null;
  event_url: string | null;
  created_at: string;
}

export interface ScrapeLog {
  id: string;
  source_name: string;
  started_at: string;
  finished_at: string | null;
  events_found: number;
  events_new: number;
  events_updated: number;
  events_inactive: number;
  status: "running" | "success" | "error";
  error_message: string | null;
}
