import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  consent: z.boolean(),
  event_id: z.string().uuid().optional(),
  event_title: z.string().optional(),
  event_url: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = schema.parse(body);

    const { error } = await supabaseAdmin.from("email_leads").insert({
      email: data.email,
      consent: data.consent,
      event_id: data.event_id || null,
      event_title: data.event_title || null,
      event_url: data.event_url || null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || "Validation error" }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
