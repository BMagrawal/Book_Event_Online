"use client";

import type { Event, EventStatus } from "@/lib/types";
import { format, parseISO, isValid } from "date-fns";

interface EventCardProps {
  event: Event;
  onGetTickets: () => void;
}

const STATUS_COLORS: Record<EventStatus, string> = {
  new: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  updated: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  inactive: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  imported: "bg-purple-500/15 text-purple-400 border-purple-500/20",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Date TBA";
  try {
    const d = parseISO(dateStr);
    if (!isValid(d)) return dateStr;
    return format(d, "EEE d MMM, h:mm a");
  } catch {
    return dateStr;
  }
}

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=70",
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&q=70",
  "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&q=70",
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=70",
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=70",
];

function getPlaceholder(id: string): string {
  const idx = id.charCodeAt(0) % PLACEHOLDER_IMAGES.length;
  return PLACEHOLDER_IMAGES[idx];
}

export function EventCard({ event, onGetTickets }: EventCardProps) {
  const imageUrl = event.image_url || getPlaceholder(event.id);

  return (
    <div className="group bg-zinc-900 border border-zinc-800/60 rounded-2xl overflow-hidden flex flex-col hover:border-zinc-700 transition-all hover:shadow-xl hover:shadow-black/30">
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-zinc-800">
        <img
          src={imageUrl}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = getPlaceholder(event.id);
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_COLORS[event.status]}`}>
            {event.status}
          </span>
        </div>

        {/* Category */}
        {event.category && (
          <div className="absolute top-3 right-3">
            <span className="text-[10px] font-medium bg-black/50 backdrop-blur-sm text-zinc-300 px-2 py-0.5 rounded-full">
              {event.category}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="text-sm font-semibold text-zinc-100 line-clamp-2 mb-2 leading-snug">
          {event.title}
        </h3>

        <div className="space-y-1.5 mb-3">
          {/* Date */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <svg className="w-3.5 h-3.5 text-orange-400/70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-zinc-400">{formatDate(event.date_time)}</span>
          </div>

          {/* Venue */}
          {(event.venue_name || event.venue_address) && (
            <div className="flex items-start gap-1.5 text-xs text-zinc-500">
              <svg className="w-3.5 h-3.5 text-orange-400/70 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="line-clamp-1">{event.venue_name || event.venue_address}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-xs text-zinc-500 line-clamp-2 mb-3 leading-relaxed flex-1">
            {event.description}
          </p>
        )}

        <div className="mt-auto space-y-2">
          {/* Source */}
          <div className="flex items-center gap-1 text-[10px] text-zinc-600">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            via {event.source_name}
          </div>

          {/* CTA */}
          <button
            onClick={onGetTickets}
            className="w-full bg-orange-500 hover:bg-orange-400 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
          >
            GET TICKETS
          </button>
        </div>
      </div>
    </div>
  );
}
