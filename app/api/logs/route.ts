// app/api/logs/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // Mengambil timestamp dari log terakhir yang dilihat oleh klien
    const lastFetched = searchParams.get("last_fetched");

    let query = supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false });

    // Jika ada timestamp, hanya ambil log yang LEBIH BARU dari timestamp tersebut
    if (lastFetched) {
      query = query.gt("created_at", lastFetched);
    } else {
        // Jika tidak ada, ambil 10 log pertama
        query = query.limit(10);
    }

    const { data: logs, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    const e = error as Error;
    return NextResponse.json({ error: "Gagal mengambil log: " + e.message }, { status: 500 });
  }
}