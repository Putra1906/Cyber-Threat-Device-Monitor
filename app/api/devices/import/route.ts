import { type NextRequest, NextResponse } from "next/server";
import { mockDatabase } from "@/lib/mock-database";
import * as xlsx from "xlsx";

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
    
    // Convert sheet to JSON with expected headers
    const jsonData: any[] = xlsx.utils.sheet_to_json(worksheet);

    let importedCount = 0;
    const errors: string[] = [];
    const existingIps = new Set(mockDatabase.getAllDevices().map(d => d.ip_address));

    for (const row of jsonData) {
      // Destructure all possible columns
      const { name, ip_address, location, status, latitude, longitude } = row;

      if (!name || !ip_address) {
        errors.push(`Baris dilewati: 'name' dan 'ip_address' wajib diisi.`);
        continue;
      }
      
      if(existingIps.has(ip_address)) {
        errors.push(`Baris dilewati: IP Address ${ip_address} sudah ada.`);
        continue;
      }
      
      // --- LOGIKA BARU UNTUK KOORDINAT ---
      // Convert to number, ensure they are valid, or set to undefined
      const lat = latitude ? parseFloat(latitude) : undefined;
      const lng = longitude ? parseFloat(longitude) : undefined;
      
      const hasValidCoords = !isNaN(lat!) && !isNaN(lng!);

      // Add device to our mock database
      mockDatabase.createDevice({
        name,
        ip_address,
        location: location || "",
        status: status || "Allowed",
        latitude: hasValidCoords ? lat : undefined,
        longitude: hasValidCoords ? lng : undefined,
      });
      existingIps.add(ip_address);
      importedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Impor selesai. ${importedCount} perangkat ditambahkan.`,
      importedCount,
      errors,
    });

  } catch (error) {
    console.error("Error importing from Excel:", error);
    return NextResponse.json({ error: "Gagal memproses file Excel." }, { status: 500 });
  }
}