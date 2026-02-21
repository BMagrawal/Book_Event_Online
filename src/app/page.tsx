"use client";

import { useEffect, useState, useCallback } from "react";
import type { Event } from "@/lib/types";
import { EventCard } from "@/components/EventCard";
import { TicketsModal } from "@/components/TicketsModal";
import { format } from "date-fns";

const CATEGORIES = [
  "All",
  "Music",
  "Festival",
  "Art",
  "Food & Drink",
  "Sport",
  "Business",
  "Film",
  "Health & Wellness",
  "Community",
  "Conference",
  "Celebration",
];

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [ticketsOpen, setTicketsOpen] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        city: "Sydney",
        page: String(page),
        limit: "12",
      });
      if (search) params.set("search", search);
      if (category !== "All") params.set("category", category);

      const res = await fetch(`/api/events?${params}`);
      const data = await res.json();
      setEvents(data.events || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [search, category, page]);

  useEffect(() => {
    const init = async () => {
      setInitializing(true);
      try {
        await fetch("/api/init");
      } finally {
        setInitializing(false);
        fetchEvents();
      }
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!initializing) fetchEvents();
  }, [fetchEvents]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGetTickets = (event: Event) => {
    setSelectedEvent(event);
    setTicketsOpen(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white leading-none">Sydney Events</h1>
              <p className="text-xs text-zinc-500 leading-none mt-0.5">What&apos;s on in Sydney</p>
            </div>
          </div>
          <a
            href="/dashboard"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Admin Dashboard
          </a>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-10">
        <div className="text-center mb-12">
          
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
            Discover Sydney&apos;s{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-500">
              Best Events
            </span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Automatically curated from the web&apos;s top event sources.{" "}
            {total > 0 && <span className="text-zinc-300 font-medium">{total} events found.</span>}
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search events, venues, artists..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
            />
          </div>
        </div>

        {/* Category filters */}
        <div className="flex gap-2 flex-wrap justify-center mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                category === cat
                  ? "bg-orange-500 text-white"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Events grid */}
        {loading || initializing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-zinc-900 rounded-2xl overflow-hidden animate-pulse"
              >
                <div className="h-44 bg-zinc-800" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-zinc-800 rounded w-3/4" />
                  <div className="h-3 bg-zinc-800 rounded w-1/2" />
                  <div className="h-3 bg-zinc-800 rounded w-2/3" />
                  <div className="h-8 bg-zinc-800 rounded-lg mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-zinc-400 font-medium">No events found</p>
            <p className="text-zinc-600 text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onGetTickets={() => handleGetTickets(event)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm disabled:opacity-40 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
                >
                  Previous
                </button>
                <span className="text-zinc-500 text-sm">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm disabled:opacity-40 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 mt-20 py-8 text-center text-zinc-600 text-sm">
        <p>Sydney Events &copy; {new Date().getFullYear()} &mdash;Created by Bharat Agrawal Event Booking</p>
        <p className="mt-1 text-xs text-zinc-700">
          Last updated: {format(new Date(), "d MMM yyyy, h:mm a")} AEST
        </p>
      </footer>

      {ticketsOpen && selectedEvent && (
        <TicketsModal
          event={selectedEvent}
          onClose={() => setTicketsOpen(false)}
        />
      )}
    </div>
  );
}
