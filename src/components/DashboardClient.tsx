"use client";

import { useState, useEffect, useCallback } from "react";
import type { Event, EventStatus } from "@/lib/types";
import { format, parseISO, isValid } from "date-fns";
import { signOut } from "next-auth/react";

interface DashboardClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const STATUS_COLORS: Record<EventStatus, string> = {
  new: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  updated: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  inactive: "bg-zinc-600/15 text-zinc-500 border-zinc-600/25",
  imported: "bg-purple-500/15 text-purple-400 border-purple-500/25",
};

const CITIES = ["Sydney", "Melbourne", "Brisbane", "Perth"];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = parseISO(dateStr);
    if (!isValid(d)) return dateStr;
    return format(d, "d MMM yyyy, HH:mm");
  } catch {
    return dateStr;
  }
}

export function DashboardClient({ user }: DashboardClientProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [scrapeResults, setScrapeResults] = useState<null | { source_name: string; events_new: number; events_updated: number; events_found: number; error?: string }[]>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [importNotes, setImportNotes] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [city, setCity] = useState("Sydney");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ city, page: String(page), limit: "20", include_inactive: "true" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);

      const res = await fetch(`/api/events?${params}`);
      const data = await res.json();
      setEvents(data.events || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }, [city, search, statusFilter, dateFrom, dateTo, page]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleScrape = async (source?: string) => {
    setScraping(true);
    setScrapeResults(null);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(source ? { source } : {}),
      });
      const data = await res.json();
      setScrapeResults(data.results || []);
      fetchEvents();
    } finally {
      setScraping(false);
    }
  };

  const handleImport = async (eventId: string) => {
    setImportLoading(true);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId, import_notes: importNotes }),
      });
      const data = await res.json();
      if (data.success) {
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId
              ? { ...e, status: "imported" as EventStatus, imported_at: new Date().toISOString(), imported_by: user.email || "" }
              : e
          )
        );
        if (selectedEvent?.id === eventId) {
          setSelectedEvent((prev) => prev ? { ...prev, status: "imported", imported_at: new Date().toISOString(), imported_by: user.email || "" } : null);
        }
        setImportNotes("");
      }
    } finally {
      setImportLoading(false);
    }
  };

  const statusCounts = events.reduce((acc, e) => {
    acc[e.status] = (acc[e.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Top nav */}
      <header className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-white">Sydney Events</span>
            </a>
            <span className="text-zinc-700">/</span>
            <span className="text-sm text-zinc-400">Admin Dashboard</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleScrape()}
              disabled={scraping}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
            >
              {scraping ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              {scraping ? "Scraping..." : "Run Scraper"}
            </button>

            <div className="flex items-center gap-2">
              {user.image && (
                <img src={user.image} alt="" className="w-7 h-7 rounded-full" />
              )}
              <span className="text-xs text-zinc-400 hidden sm:block">{user.email}</span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors px-2 py-1 rounded"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col gap-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Events", value: total, icon: "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
            { label: "New", value: statusCounts.new || 0, color: "text-emerald-400" },
            { label: "Updated", value: statusCounts.updated || 0, color: "text-blue-400" },
            { label: "Imported", value: statusCounts.imported || 0, color: "text-purple-400" },
          ].map((stat) => (
            <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color || "text-white"}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Scrape results */}
        {scrapeResults && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">Last Scrape Results</h3>
            <div className="flex flex-wrap gap-2">
              {scrapeResults.map((r) => (
                <div key={r.source_name} className={`text-xs px-3 py-1.5 rounded-lg border ${r.error ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-zinc-800 border-zinc-700 text-zinc-400"}`}>
                  <span className="font-medium text-zinc-300">{r.source_name}</span>
                  {r.error ? ` — Error: ${r.error}` : ` — ${r.events_found} found, ${r.events_new} new, ${r.events_updated} updated`}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* City */}
            <select
              value={city}
              onChange={(e) => { setCity(e.target.value); setPage(1); }}
              className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Search */}
            <div className="relative lg:col-span-2">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search title, venue, description..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-300 placeholder-zinc-600 text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              />
            </div>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="updated">Updated</option>
              <option value="inactive">Inactive</option>
              <option value="imported">Imported</option>
            </select>

            {/* Date range */}
            <div className="flex gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              />
            </div>
          </div>
        </div>

        {/* Main content: table + preview */}
        <div className="flex gap-4 flex-1 min-h-0">
          {/* Table */}
          <div className="flex-1 min-w-0 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
            <div className="border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-300">
                Events <span className="text-zinc-600 font-normal">({total})</span>
              </span>
              {selectedEvent && (
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Close preview
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <svg className="w-6 h-6 text-zinc-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left px-4 py-2.5 text-zinc-500 font-medium">Title</th>
                      <th className="text-left px-3 py-2.5 text-zinc-500 font-medium hidden md:table-cell">Date</th>
                      <th className="text-left px-3 py-2.5 text-zinc-500 font-medium hidden lg:table-cell">Venue</th>
                      <th className="text-left px-3 py-2.5 text-zinc-500 font-medium hidden sm:table-cell">Source</th>
                      <th className="text-left px-3 py-2.5 text-zinc-500 font-medium">Status</th>
                      <th className="text-right px-4 py-2.5 text-zinc-500 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className={`border-b border-zinc-800/50 hover:bg-zinc-800/40 cursor-pointer transition-colors ${selectedEvent?.id === event.id ? "bg-zinc-800/60" : ""}`}
                      >
                        <td className="px-4 py-3 max-w-[200px]">
                          <p className="font-medium text-zinc-200 truncate">{event.title}</p>
                          <p className="text-zinc-600 truncate">{event.city}</p>
                        </td>
                        <td className="px-3 py-3 text-zinc-500 hidden md:table-cell whitespace-nowrap">
                          {formatDate(event.date_time)}
                        </td>
                        <td className="px-3 py-3 text-zinc-500 hidden lg:table-cell max-w-[150px]">
                          <span className="truncate block">{event.venue_name || "—"}</span>
                        </td>
                        <td className="px-3 py-3 text-zinc-500 hidden sm:table-cell whitespace-nowrap">
                          {event.source_name}
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wide ${STATUS_COLORS[event.status]}`}>
                            {event.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {event.status !== "imported" && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleImport(event.id); }}
                              disabled={importLoading}
                              className="text-[10px] font-semibold bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/25 text-purple-400 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                            >
                              Import
                            </button>
                          )}
                          {event.status === "imported" && (
                            <span className="text-[10px] text-zinc-600">Imported</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {events.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-zinc-600">
                          No events found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Table pagination */}
            {totalPages > 1 && (
              <div className="border-t border-zinc-800 px-4 py-3 flex items-center justify-between">
                <span className="text-xs text-zinc-600">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="text-xs px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-lg disabled:opacity-40 hover:text-zinc-200 transition-colors"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="text-xs px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-lg disabled:opacity-40 hover:text-zinc-200 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Preview panel */}
          {selectedEvent && (
            <div className="w-80 shrink-0 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
              <div className="border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-300">Event Details</span>
                <button onClick={() => setSelectedEvent(null)} className="text-zinc-600 hover:text-zinc-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedEvent.image_url && (
                  <img
                    src={selectedEvent.image_url}
                    alt={selectedEvent.title}
                    className="w-full h-36 object-cover rounded-xl"
                  />
                )}

                <div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wide mb-2 ${STATUS_COLORS[selectedEvent.status]}`}>
                    {selectedEvent.status}
                  </span>
                  <h3 className="text-sm font-semibold text-zinc-100 leading-snug">{selectedEvent.title}</h3>
                </div>

                <div className="space-y-2 text-xs">
                  <DetailRow label="Date" value={formatDate(selectedEvent.date_time)} />
                  {selectedEvent.date_time_end && <DetailRow label="End Date" value={formatDate(selectedEvent.date_time_end)} />}
                  <DetailRow label="Venue" value={selectedEvent.venue_name || "—"} />
                  <DetailRow label="Address" value={selectedEvent.venue_address || "—"} />
                  <DetailRow label="City" value={selectedEvent.city} />
                  <DetailRow label="Category" value={selectedEvent.category || "—"} />
                  <DetailRow label="Source" value={selectedEvent.source_name} />
                  <DetailRow label="Last Scraped" value={formatDate(selectedEvent.last_scraped_at)} />
                  {selectedEvent.imported_at && (
                    <>
                      <DetailRow label="Imported At" value={formatDate(selectedEvent.imported_at)} />
                      <DetailRow label="Imported By" value={selectedEvent.imported_by || "—"} />
                    </>
                  )}
                </div>

                {selectedEvent.description && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-1 font-medium">Description</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">{selectedEvent.description}</p>
                  </div>
                )}

                {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-1.5 font-medium">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedEvent.tags.map((tag) => (
                        <span key={tag} className="text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <a
                  href={selectedEvent.original_event_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View original event
                </a>
              </div>

              {/* Import action */}
              {selectedEvent.status !== "imported" && (
                <div className="border-t border-zinc-800 p-4 space-y-2">
                  <textarea
                    placeholder="Import notes (optional)"
                    value={importNotes}
                    onChange={(e) => setImportNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-zinc-800 border border-zinc-700 text-zinc-300 placeholder-zinc-600 text-xs rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                  <button
                    onClick={() => handleImport(selectedEvent.id)}
                    disabled={importLoading}
                    className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {importLoading ? (
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    )}
                    Import to Platform
                  </button>
                </div>
              )}

              {selectedEvent.status === "imported" && (
                <div className="border-t border-zinc-800 p-4">
                  <div className="flex items-center gap-2 text-xs text-purple-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Imported {selectedEvent.imported_at ? formatDate(selectedEvent.imported_at) : ""}</span>
                  </div>
                  {selectedEvent.import_notes && (
                    <p className="mt-2 text-xs text-zinc-500">{selectedEvent.import_notes}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-zinc-600 shrink-0 w-24">{label}</span>
      <span className="text-zinc-400 break-all">{value}</span>
    </div>
  );
}
