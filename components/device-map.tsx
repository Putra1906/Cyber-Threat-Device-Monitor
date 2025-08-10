"use client"

import { useEffect, useRef } from "react"
import 'leaflet/dist/leaflet.css';
import './map-animations.css'; 

// Cek apakah 'window' ada (hanya berjalan di sisi client)
const IS_BROWSER = typeof window !== "undefined";

interface Device {
  id: number
  name: string
  ip_address: string
  location: string
  status: string
  detected_at: string
  latitude?: number
  longitude?: number
}

interface DeviceMapProps {
  devices: Device[]
}

export default function DeviceMap({ devices }: DeviceMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // --- PERBAIKAN UTAMA ADA DI SINI ---
  useEffect(() => {
    // Jangan lakukan apapun jika tidak di browser atau jika peta sudah ada
    if (!IS_BROWSER || !mapRef.current || mapInstanceRef.current) {
      return;
    }

    // Import Leaflet secara dinamis
    import("leaflet").then(L => {
      // Fix icon path issue
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Inisialisasi peta
      mapInstanceRef.current = L.map(mapRef.current!, {
        center: [-6.9381, 107.6611],
        zoom: 18,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstanceRef.current);
    });

    // Fungsi cleanup: akan berjalan saat komponen dibongkar
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Dependency array kosong memastikan ini hanya berjalan sekali

  useEffect(() => {
    // useEffect untuk update marker, tidak ada perubahan di sini
    if (!IS_BROWSER || !mapInstanceRef.current) return;

    const updateMapLayers = async () => {
      const L = (await import("leaflet"));
      const layerGroup = L.layerGroup().addTo(mapInstanceRef.current);
      
      const devicesWithCoords = devices.filter(d => d.latitude != null && d.longitude != null);
      if (devicesWithCoords.length === 0) return;

      const centralDevice = devicesWithCoords.find(d => d.id === 1);
      const centralLatLng = centralDevice ? L.latLng(centralDevice.latitude!, centralDevice.longitude!) : null;

      devicesWithCoords.forEach((device) => {
        const deviceLatLng = L.latLng(device.latitude!, device.longitude!);
        let customIcon;

        if (device.id === 1) {
          customIcon = L.divIcon({
            html: `<div class="hub-marker-wrapper"><div class="hub-marker"></div></div>`,
            className: "hub-marker-container", iconSize: [32, 32], iconAnchor: [16, 16],
          });
        } else {
          let iconColor = "#3b82f6";
          if (device.status.toLowerCase() === "allowed") iconColor = "#10b981";
          else if (device.status.toLowerCase() === "blocked") iconColor = "#ef4444";
          else if (device.status.toLowerCase() === "maintenance") iconColor = "#f59e0b";
          
          customIcon = L.divIcon({
            html: `<div style="background-color: ${iconColor};" class="device-marker"></div>`,
            className: "device-marker-container", iconSize: [22, 22], iconAnchor: [11, 11],
          });
        }

        L.marker(deviceLatLng, { icon: customIcon })
          .bindPopup(`<b>${device.name}</b><br>IP: ${device.ip_address}<br>Status: ${device.status}`)
          .addTo(layerGroup);
          
        if (centralLatLng && device.id !== centralDevice?.id) {
          L.polyline([centralLatLng, deviceLatLng], {
              color: '#22c55e', weight: 3, opacity: 0.9, className: 'animated-line',
          }).addTo(layerGroup);
        }
      });
      
      const bounds = L.latLngBounds(devicesWithCoords.map(d => [d.latitude!, d.longitude!]));
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds.pad(0.5));
      }

       // Cleanup untuk layer group
       return () => {
           if(mapInstanceRef.current && layerGroup) {
               mapInstanceRef.current.removeLayer(layerGroup);
           }
       }
    };

    updateMapLayers();
  }, [devices]);

  return (
    <div className="relative">
      <div ref={mapRef} className="h-96 w-full rounded-lg border border-gray-200 z-0" />
       <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 border border-gray-200 z-10">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Device Status</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2"><div style={{width: '18px', height: '18px', borderRadius: '50%', border: '2px solid white', boxShadow: '0 0 3px rgba(0,0,0,0.4)', background: 'radial-gradient(circle at 6px 6px, #60a5fa, #2563eb)'}}></div><span className="text-xs text-gray-600">Core Router</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div><span className="text-xs text-gray-600">Allowed</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span className="text-xs text-gray-600">Blocked</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div><span className="text-xs text-gray-600">Maintenance</span></div>
        </div>
      </div>
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2 border border-gray-200 z-10">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span className="text-sm font-medium text-gray-900">
            {devices.filter((d) => d.latitude && d.longitude).length} devices mapped
          </span>
        </div>
      </div>
    </div>
  );
}