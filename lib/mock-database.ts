// lib/mock-database.ts

interface Device {
  id: number;
  name: string;
  ip_address: string;
  location: string;
  status: string;
  detected_at: string;
  latitude?: number;
  longitude?: number;
}

// Database disederhanakan sesuai permintaan
const devices: Device[] = [
  {
    id: 1,
    name: "Core Router",
    ip_address: "10.0.0.1",
    location: "Data Center",
    status: "Allowed",
    detected_at: "2025-08-06 10:00:00",
    latitude: -6.938138733645462,
    longitude: 107.66116659273092,
  },
  {
    id: 2,
    name: "AP Lantai 1",
    ip_address: "192.168.1.10",
    location: "Lantai 1",
    status: "Allowed",
    detected_at: "2025-08-06 10:01:00",
    latitude: -6.938341972692619,
    longitude: 107.66129151555077,
  },
  {
    id: 3,
    name: "CCTV Lobby",
    ip_address: "192.168.1.20",
    location: "Lobby",
    status: "Blocked",
    detected_at: "2025-08-06 10:02:00",
    latitude: -6.938355285524472,
    longitude: 107.66128481002849,
  },
  {
    id: 4,
    name: "PC Staff Gudang",
    ip_address: "192.168.1.30",
    location: "Gudang",
    status: "Allowed",
    detected_at: "2025-08-06 10:03:00",
    latitude: -6.938325331652282,
    longitude: 107.66103603515211,
  },
  {
    id: 5,
    name: "Printer HRD",
    ip_address: "192.168.1.40",
    location: "Ruang HRD",
    status: "Maintenance",
    detected_at: "2025-08-06 10:04:00",
    latitude: -6.938337978842996,
    longitude: 107.66103201183876,
  },
  {
    id: 6,
    name: "Mesin Absensi",
    ip_address: "192.168.1.50",
    location: "Pintu Masuk",
    status: "Allowed",
    detected_at: "2025-08-06 10:05:00",
    latitude: -6.938341972692619,
    longitude: 107.66129151555077,
  }
];

let nextId = Math.max(...devices.map((d) => d.id)) + 1;

export const mockDatabase = {
  getAllDevices: (): Device[] => {
    return [...devices];
  },

  searchDevices: (keyword: string): Device[] => {
    if (!keyword) return [...devices];
    const lowerKeyword = keyword.toLowerCase();
    return devices.filter(
      (device) =>
        device.name.toLowerCase().includes(lowerKeyword) ||
        device.ip_address.toLowerCase().includes(lowerKeyword) ||
        device.location.toLowerCase().includes(lowerKeyword) ||
        device.status.toLowerCase().includes(lowerKeyword)
    );
  },
  
  getDeviceById: (id: number): Device | null => {
    const device = devices.find((d) => d.id === id);
    return device ? { ...device } : null;
  },

  createDevice: (deviceData: Omit<Device, "id" | "detected_at">): Device => {
    const newDevice: Device = {
      id: nextId++,
      ...deviceData,
      detected_at: new Date().toISOString().slice(0, 19).replace("T", " "),
    };
    devices.push(newDevice);
    return { ...newDevice };
  },

  updateDevice: (id: number, updateData: Partial<Omit<Device, "id">>): Device | null => {
    const deviceIndex = devices.findIndex((d) => d.id === id);
    if (deviceIndex === -1) return null;

    devices[deviceIndex] = {
      ...devices[deviceIndex],
      ...updateData,
      detected_at: new Date().toISOString().slice(0, 19).replace("T", " "),
    };
    return { ...devices[deviceIndex] };
  },

  deleteDevice: (id: number): boolean => {
    const deviceIndex = devices.findIndex((d) => d.id === id);
    if (deviceIndex === -1) return false;
    devices.splice(deviceIndex, 1);
    return true;
  },
};

export type { Device };