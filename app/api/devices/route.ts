import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Fungsi helper untuk mencatat log aktivitas
async function logActivity(level: 'Info' | 'Peringatan' | 'Kritis', message: string) {
  await supabase.from('activity_logs').insert({ level, message });
}

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
    return NextResponse.json({ error: "Failed to fetch devices" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const deviceData = await request.json();
    
    // --- FITUR 1: INTEGRASI THREAT INTELLIGENCE ---
    const { data: threat } = await supabase
      .from('threat_intelligence')
      .select('threat_type')
      .eq('ip_address', deviceData.ip_address)
      .single();

    if (threat) {
      // Jika IP ada di daftar hitam, paksa status menjadi "Blocked"
      deviceData.status = 'Blocked';
      await logActivity('Peringatan', `Perangkat "${deviceData.name}" (${deviceData.ip_address}) otomatis diblokir. Alasan: ${threat.threat_type}.`);
    }
    // --- AKHIR FITUR 1 ---

    const { data, error } = await supabase.from("devices").insert([deviceData]).select().single();
    if (error) {
        if (error.code === '23505') {
            return NextResponse.json({ error: "A device with this IP address already exists" }, { status: 400 });
        }
        throw error;
    }

    await logActivity('Info', `Perangkat baru "${data.name}" berhasil ditambahkan.`);
    return NextResponse.json({ success: true, device: data }, { status: 201 });
  } catch (error) {
    await logActivity('Kritis', `Gagal menambahkan perangkat baru.`);
    return NextResponse.json({ error: "Failed to create device" }, { status: 500 });
  }
}