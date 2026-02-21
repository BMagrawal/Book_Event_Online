import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const city = searchParams.get("city") || "Sydney";
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const category = searchParams.get("category") || "";
  const dateFrom = searchParams.get("date_from") || "";
  const dateTo = searchParams.get("date_to") || "";
  const includeInactive = searchParams.get("include_inactive") === "true";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "24");
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from("events")
    .select("*", { count: "exact" })
    .eq("city", city)
    .order("date_time", { ascending: true, nullsFirst: false });

  // Public listing excludes inactive unless explicitly requested
  if (!includeInactive && !status) {
    query = query.neq("status", "inactive");
  }

  if (search) {
    query = query.or(
      `title.ilike.%${search}%,description.ilike.%${search}%,venue_name.ilike.%${search}%`
    );
  }

  if (status) {
    query = query.eq("status", status);
  }

  if (category) {
    query = query.ilike("category", `%${category}%`);
  }

  if (dateFrom) {
    query = query.gte("date_time", dateFrom);
  }

  if (dateTo) {
    query = query.lte("date_time", dateTo);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    events: data,
    total: count,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  });
}
