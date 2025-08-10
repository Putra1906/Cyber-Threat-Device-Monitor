import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface RouteContext {
  params: {
    id: string;
  };
}

// FUNGSI GET (Mengambil satu perangkat)
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const { data, error } = await supabase.from("devices").select("*").eq("id", id).single();

    if (error) {
      // Jika tidak ditemukan, Supabase akan memberikan error, ini cara menanganinya
      return NextResponse.json({ error: `Perangkat dengan ID ${id} tidak ditemukan.` }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, device: data });
  } catch (e) {
    // Menangani error tak terduga lainnya
    const error = e as Error;
    return NextResponse.json({ error: "Terjadi kesalahan internal: " + error.message }, { status: 500 });
  }
}

// FUNGSI PUT (Memperbarui perangkat)
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const updateData = await request.json();
    delete updateData.id;

    // Menambahkan timestamp terbaru setiap kali ada update
    updateData.detected_at = new Date().toISOString();

    const { data, error } = await supabase.from("devices").update(updateData).eq("id", id).select().single();

    if (error) {
      if (error.code === '23505') { // Error duplikasi IP
        return NextResponse.json({ error: "Alamat IP ini sudah digunakan oleh perangkat lain." }, { status: 400 });
      }
      throw error; // Lemparkan error lain untuk ditangkap di blok catch
    }
    
    return NextResponse.json({ success: true, device: data });
  } catch (e) {
    const error = e as Error;
    return NextResponse.json({ error: "Gagal memperbarui perangkat: " + error.message }, { status: 500 });
  }
}

// FUNGSI DELETE (Menghapus perangkat)
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const { error } = await supabase.from("devices").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Perangkat berhasil dihapus." });
  } catch (e) {
    const error = e as Error;
    return NextResponse.json({ error: "Gagal menghapus perangkat: " + error.message }, { status: 500 });
  }
}