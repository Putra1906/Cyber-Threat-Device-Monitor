import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("q") || "";

    let query = supabase.from("devices").select("*").order("id", { ascending: true });

    if (keyword) {
      query = query.or(`name.ilike.%${keyword}%,ip_address.ilike.%${keyword}%,location.ilike.%${keyword}%`);
    }

    const { data: devices, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, devices });
  } catch (error) {
    console.error("Error fetching devices:", error);
    return NextResponse.json({ error: "Failed to fetch devices" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const deviceData = await request.json();

    const { data, error } = await supabase
      .from("devices")
      .insert([deviceData])
      .select()
      .single();

    if (error) {
        // Handle duplicate IP error
        if (error.code === '23505') {
            return NextResponse.json({ error: "A device with this IP address already exists" }, { status: 400 });
        }
        throw error;
    }

    return NextResponse.json({ success: true, device: data }, { status: 201 });
  } catch (error) {
    console.error("Error creating device:", error);
    return NextResponse.json({ error: "Failed to create device" }, { status: 500 });
  }
}