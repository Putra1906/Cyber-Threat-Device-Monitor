import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Tipe untuk parameter URL
interface RouteContext {
  params: {
    id: string;
  };
}

// FUNGSI GET (Mengambil satu perangkat)
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = params;
  try {
    const { data, error } = await supabase.from("devices").select("*").eq("id", id).single();
    if (error) {
      // Jika tidak ditemukan, Supabase akan memberikan error
      return NextResponse.json({ error: `Perangkat dengan ID ${id} tidak ditemukan.` }, { status: 404 });
    }
    return NextResponse.json({ success: true, device: data });
  } catch (e) {
    const error = e as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// FUNGSI PUT (Memperbarui perangkat)
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = params;
  try {
    const updateData = await request.json();
    const { data, error } = await supabase.from("devices").update(updateData).eq("id", id).select().single();

    if (error) {
      if (error.code === '23505') { // Error untuk duplikasi data unik (misal: IP Address)
        return NextResponse.json({ error: "Alamat IP ini sudah digunakan oleh perangkat lain." }, { status: 400 });
      }
      throw error;
    }
    
    return NextResponse.json({ success: true, device: data });
  } catch (e) {
    const error = e as Error;
    return NextResponse.json({ error: `Gagal memperbarui perangkat: ${error.message}` }, { status: 500 });
  }
}

// FUNGSI DELETE (Menghapus perangkat)
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { id } = params;
  try {
    const { error } = await supabase.from("devices").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true, message: "Perangkat berhasil dihapus." });
  } catch (e) {
    const error = e as Error;
    return NextResponse.json({ error: `Gagal menghapus perangkat: ${error.message}` }, { status: 500 });
  }
}