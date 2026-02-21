import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { auth } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  event_id: z.string().uuid(),
  import_notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { event_id, import_notes } = schema.parse(body);

    const { data, error } = await supabaseAdmin
      .from("events")
      .update({
        status: "imported",
        imported_at: new Date().toISOString(),
        imported_by: session.user.email,
        import_notes: import_notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", event_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, event: data });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || "Validation error" }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
