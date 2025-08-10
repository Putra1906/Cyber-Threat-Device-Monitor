"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { toast } from "sonner"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Package, CheckCircle2, XCircle, TriangleAlert, Upload, Link, Users } from 'lucide-react';

// Dynamic import untuk peta tetap sama
const DeviceMap = dynamic(() => import("@/components/device-map"), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
        <p className="text-gray-500">Memuat peta...</p>
      </div>
    </div>
  ),
})

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

type PieChartData = { name: string; value: number; };
const COLORS = { Allowed: '#22c55e', Blocked: '#ef4444', Maintenance: '#f59e0b' };

export default function Dashboard() {
  const [devices, setDevices] = useState<Device[]>([])
  const [searchKeyword, setSearchKeyword] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isImporting, setIsImporting] = useState(false);
  const [user, setUser] = useState<{ username: string } | null>(null)
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    const userData = localStorage.getItem("user")
    if (!isAuthenticated) {
      router.push("/");
      return;
    }
    if (userData) setUser(JSON.parse(userData));
    fetchDevices();
  }, [router]);

  const fetchDevices = async (keyword: string = searchKeyword) => { // Menggunakan searchKeyword dari state sebagai default
    if (devices.length === 0) setIsLoading(true);
    try {
      const url = keyword ? `/api/devices?q=${encodeURIComponent(keyword)}` : "/api/devices";
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setDevices(data.devices || []);
      } else {
        toast.error("Gagal mengambil data perangkat.");
      }
    } catch (error) {
      console.error("Gagal mengambil data perangkat:", error);
      toast.error("Gagal mengambil data perangkat.");
    } finally {
      setIsLoading(false);
    }
  }
  
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    const toastId = toast.loading("Mengimpor perangkat dari Excel...");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("/api/devices/import", { method: "POST", body: formData });
      const result = await response.json();
      if (response.ok && result.success) {
        toast.success(`Berhasil mengimpor ${result.importedCount} perangkat baru!`, { id: toastId });
        fetchDevices();
      } else {
        throw new Error(result.error || "Gagal mengimpor file.");
      }
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsImporting(false);
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDevices(searchKeyword);
  }
  
  const handleDelete = async (id: number) => {
    // Mencegah penghapusan Core Router
    if (id === 1) {
      toast.error("Core Router tidak dapat dihapus.");
      return;
    }
    if (!confirm("Apakah Anda yakin ingin menghapus perangkat ini?")) return;
    try {
      const response = await fetch(`/api/devices/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Perangkat berhasil dihapus.");
        setDevices(devices.filter((device) => device.id !== id));
      } else {
         const data = await response.json();
        throw new Error(data.error || "Gagal menghapus perangkat.");
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    router.push("/");
  }
  
  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold";
    switch (status.toLowerCase()) {
      case "allowed": return `${baseClasses} bg-green-100 text-green-800`;
      case "blocked": return `${baseClasses} bg-red-100 text-red-800`;
      case "maintenance": return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default: return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };
  
  const stats = {
      total: devices.length,
      allowed: devices.filter((d) => d.status.toLowerCase() === "allowed").length,
      blocked: devices.filter((d) => d.status.toLowerCase() === "blocked").length,
      maintenance: devices.filter((d) => d.status.toLowerCase() === "maintenance").length
  };
  
  const pieData: PieChartData[] = [
      { name: 'Allowed', value: stats.allowed },
      { name: 'Blocked', value: stats.blocked },
      { name: 'Maintenance', value: stats.maintenance },
  ].filter(item => item.value > 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat dasbor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <h1 className="text-xl font-bold text-gray-800">Cyber Threat Device Monitor</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700 hidden sm:block">Selamat datang, {user?.username}</span>
              <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Logout</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-1">Device Management</h2>
          <p className="text-gray-600">Monitor dan kelola perangkat jaringan di seluruh infrastruktur Anda</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 grid grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 flex items-start justify-between"><div className="flex flex-col"> <p className="text-sm font-medium text-gray-500">Total Perangkat</p><p className="text-3xl font-bold text-gray-800 mt-1">{stats.total}</p></div><div className="p-3 bg-blue-100 rounded-lg"><Package className="h-6 w-6 text-blue-600" /></div></div>
                <div className="bg-white rounded-xl shadow-sm p-6 flex items-start justify-between"><div className="flex flex-col"> <p className="text-sm font-medium text-gray-500">Allowed</p><p className="text-3xl font-bold text-gray-800 mt-1">{stats.allowed}</p></div><div className="p-3 bg-green-100 rounded-lg"><CheckCircle2 className="h-6 w-6 text-green-600" /></div></div>
                <div className="bg-white rounded-xl shadow-sm p-6 flex items-start justify-between"><div className="flex flex-col"> <p className="text-sm font-medium text-gray-500">Blocked</p><p className="text-3xl font-bold text-gray-800 mt-1">{stats.blocked}</p></div><div className="p-3 bg-red-100 rounded-lg"><XCircle className="h-6 w-6 text-red-600" /></div></div>
                <div className="bg-white rounded-xl shadow-sm p-6 flex items-start justify-between"><div className="flex flex-col"> <p className="text-sm font-medium text-gray-500">Maintenance</p><p className="text-3xl font-bold text-gray-800 mt-1">{stats.maintenance}</p></div><div className="p-3 bg-yellow-100 rounded-lg"><TriangleAlert className="h-6 w-6 text-yellow-600" /></div></div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Status Perangkat</h3>
                <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" labelLine={false} outerRadius={80} dataKey="value" nameKey="name" label={(entry) => entry.value}>
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend iconSize={10} wrapperStyle={{fontSize: '14px'}}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 w-full sm:w-auto">
              <input type="text" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} placeholder="Cari perangkat..." className="w-full sm:max-w-xs pl-4 pr-3 py-2 border rounded-lg focus:ring-red-500 focus:border-red-500"/>
              <button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium">Cari</button>
            </form>
            <div className="flex gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".xlsx, .xls, .csv" />
                <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 disabled:bg-blue-300">
                    {isImporting ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Upload className="w-5 h-5"/>}
                    Impor Excel
                </button>
                <button onClick={() => router.push("/dashboard/add")} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium">Tambah</button>
            </div>
          </div>
        </div>
        
        {/* PERBAIKAN: Memastikan peta tidak error jika tidak ada perangkat */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Peta Lokasi Perangkat</h3>
          {devices.length > 0 ? (
            <DeviceMap devices={devices} />
          ) : (
            <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
              Tidak ada data perangkat dengan lokasi untuk ditampilkan di peta.
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Device</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">IP Address</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Terkoneksi Ke</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Last Detected</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {devices.map((device) => (
                  <tr key={device.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{device.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{device.ip_address}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {device.id === 1 ? (
                        <div className="flex items-center gap-2 font-medium text-blue-600">
                          <Users className="h-4 w-4" />
                          <span>{devices.length - 1} Perangkat</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Link className="h-4 w-4" />
                          <span>Core Router</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{device.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className={getStatusBadge(device.status)}>{device.status}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(device.detected_at).toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-4 items-center">
                        <button onClick={() => router.push(`/dashboard/edit/${device.id}`)} className="text-blue-600 hover:text-blue-900">Edit</button>
                        <button onClick={() => handleDelete(device.id)} className="text-red-600 hover:text-red-900" disabled={device.id === 1}>Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {devices.length === 0 && !isLoading && (
            <div className="text-center py-12"><p className="mt-1 text-sm text-gray-500">Tidak ada perangkat yang ditemukan.</p></div>
          )}
        </div>
      </main>
    </div>
  )
}