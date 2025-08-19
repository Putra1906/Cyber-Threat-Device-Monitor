import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { logActivity } from "@/lib/logHelper"; // <-- Impor helper log

interface RouteContext {
  params: {
    id: string;
  };
}

// FUNGSI GET (Tidak ada perubahan)
export async function GET(request: NextRequest, { params }: RouteContext) {
    // ... (kode tetap sama)
}

// FUNGSI PUT (Tidak ada perubahan)
export async function PUT(request: NextRequest, { params }: RouteContext) {
    // ... (kode tetap sama)
}


// --- FUNGSI DELETE (YANG DIPERBARUI) ---
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;

    // Langkah 1: Ambil dulu data perangkat yang akan dihapus untuk mendapatkan namanya
    const { data: deviceToDelete, error: findError } = await supabase
      .from("devices")
      .select("name")
      .eq("id", id)
      .single();

    if (findError) throw new Error("Perangkat tidak ditemukan untuk dihapus.");

    // Langkah 2: Hapus perangkat dari database
    const { error: deleteError } = await supabase.from("devices").delete().eq("id", id);
    if (deleteError) throw deleteError;

    // Langkah 3: Catat log keberhasilan
    await logActivity('Info', `Perangkat "${deviceToDelete.name}" berhasil dihapus.`);

    return NextResponse.json({ success: true, message: "Perangkat berhasil dihapus." });
  } catch (e) {
    const error = e as Error;
    await logActivity('Kritis', `Gagal menghapus perangkat: ${error.message}`);
    return NextResponse.json({ error: "Gagal menghapus perangkat: " + error.message }, { status: 500 });
  }
}