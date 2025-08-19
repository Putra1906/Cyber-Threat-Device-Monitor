import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import * as xlsx from "xlsx";
import { logActivity } from "@/lib/logHelper"; // <-- Impor helper log

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const jsonData: any[] = xlsx.utils.sheet_to_json(worksheet);

    const devicesToInsert = jsonData.map(row => {
      const lat = row.latitude ? parseFloat(row.latitude) : null;
      const lng = row.longitude ? parseFloat(row.longitude) : null;
      return {
        name: row.name,
        ip_address: row.ip_address,
        location: row.location,
        status: row.status || 'Allowed',
        latitude: !isNaN(lat!) ? lat : null,
        longitude: !isNaN(lng!) ? lng : null,
      };
    }).filter(d => d.name && d.ip_address);

    if(devicesToInsert.length === 0) {
        return NextResponse.json({ error: "Tidak ada data valid untuk diimpor." }, { status: 400 });
    }

    const { error, count } = await supabase.from("devices").insert(devicesToInsert);

    if (error) {
        if (error.code === '23505') {
             return NextResponse.json({ error: "Gagal mengimpor: Terdapat duplikasi IP address." }, { status: 400 });
        }
        throw error;
    }

    // --- CATAT LOG KEBERHASILAN DI SINI ---
    if (count && count > 0) {
        await logActivity('Info', `Berhasil mengimpor ${count} perangkat baru dari Excel.`);
    }

    return NextResponse.json({ success: true, importedCount: count || 0 });

  } catch (error) {
    const e = error as Error;
    await logActivity('Kritis', `Gagal mengimpor dari Excel: ${e.message}`);
    return NextResponse.json({ error: "Gagal memproses file Excel." }, { status: 500 });
  }
}