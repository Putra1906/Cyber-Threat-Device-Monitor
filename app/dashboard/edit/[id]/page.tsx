"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"

interface Device {
  id: number
  name: string
  ip_address: string
  location: string
  status: string
  detected_at?: string;
  latitude?: number
  longitude?: number
}

export default function EditDevice() {
  const [formData, setFormData] = useState({
    name: "",
    ip_address: "",
    location: "",
    status: "Allowed",
    latitude: "",
    longitude: "",
  })
  const [originalData, setOriginalData] = useState<Device | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingDevice, setIsLoadingDevice] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const router = useRouter()
  const params = useParams()
  const deviceId = params.id as string

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    if (!isAuthenticated) {
      router.push("/")
      return
    }

    if (deviceId) {
      fetchDevice()
    } else {
      setFetchError("Invalid device ID")
      setIsLoadingDevice(false)
    }
  }, [router, deviceId])

  const fetchDevice = async () => {
    setIsLoadingDevice(true)
    setFetchError("")
    try {
      // --- PERBAIKAN DI SINI ---
      // Using the correct Next.js API Route, not the old Flask address
      const response = await fetch(`/api/devices/${deviceId}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to fetch device (${response.status})`)
      }
      
      const data = await response.json()

      if (data.success && data.device) {
        const device = data.device
        setOriginalData(device)
        setFormData({
          name: device.name || "",
          ip_address: device.ip_address || "",
          location: device.location || "",
          status: device.status || "Allowed",
          latitude: device.latitude?.toString() || "",
          longitude: device.longitude?.toString() || "",
        })
      } else {
        throw new Error("Invalid response format from server.")
      }
    } catch (error: any) {
      setFetchError(error.message)
    } finally {
      setIsLoadingDevice(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // --- PERBAIKAN DI SINI ---
      // Using the correct Next.js API Route
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: formData.name,
            ip_address: formData.ip_address,
            location: formData.location,
            status: formData.status,
            latitude: formData.latitude ? parseFloat(formData.latitude) : null,
            longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to update device.")

      toast.success("Device updated successfully!")
      router.push("/dashboard")
      
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingDevice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading device...</p>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Gagal Memuat Perangkat</h2>
          <p className="text-red-600 mb-4">{fetchError}</p>
          <button onClick={() => router.push("/dashboard")} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg">
            Kembali ke Dasbor
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-800">Edit Perangkat</h1>
            <button onClick={() => router.push("/dashboard")} className="text-sm text-gray-600 hover:underline">
              Batal
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">Nama Perangkat *</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-3 border rounded-xl" required />
            </div>
            <div>
              <label htmlFor="ip_address" className="block text-sm font-semibold text-gray-700 mb-2">IP Address *</label>
              <input type="text" id="ip_address" name="ip_address" value={formData.ip_address} onChange={handleInputChange} className="w-full px-4 py-3 border rounded-xl" required />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">Lokasi</label>
              <input type="text" id="location" name="location" value={formData.location} onChange={handleInputChange} className="w-full px-4 py-3 border rounded-xl" />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select id="status" name="status" value={formData.status} onChange={handleInputChange} className="w-full px-4 py-3 border rounded-xl bg-white">
                <option>Allowed</option>
                <option>Blocked</option>
                <option>Maintenance</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="latitude" className="block text-sm font-semibold text-gray-700 mb-2">Latitude</label>
                <input type="text" id="latitude" name="latitude" value={formData.latitude} onChange={handleInputChange} className="w-full px-4 py-3 border rounded-xl" />
              </div>
              <div>
                <label htmlFor="longitude" className="block text-sm font-semibold text-gray-700 mb-2">Longitude</label>
                <input type="text" id="longitude" name="longitude" value={formData.longitude} onChange={handleInputChange} className="w-full px-4 py-3 border rounded-xl" />
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button type="submit" disabled={isLoading} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl disabled:bg-red-400">
                {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
              <button type="button" onClick={() => router.push("/dashboard")} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-xl">
                Batal
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}