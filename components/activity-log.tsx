"use client"

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Info, TriangleAlert, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface Log {
  id: number;
  level: 'Info' | 'Peringatan' | 'Kritis';
  message: string;
  created_at: string;
}

const LogIcon = ({ level }: { level: Log['level'] }) => {
  switch (level) {
    case 'Peringatan':
      return <TriangleAlert className="h-5 w-5 text-yellow-500" />;
    case 'Kritis':
      return <ShieldAlert className="h-5 w-5 text-red-500" />;
    default:
      return <Info className="h-5 w-5 text-blue-500" />;
  }
};

export default function ActivityLog() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const displayedLogIds = useRef(new Set()); // Untuk mencegah notifikasi duplikat

  useEffect(() => {
    // Fungsi untuk mengambil log awal
    const fetchInitialLogs = async () => {
      try {
        const response = await fetch('/api/logs');
        const data = await response.json();
        if (data.success) {
          setLogs(data.logs);
          // Tandai semua log awal sebagai sudah ditampilkan
          data.logs.forEach((log: Log) => displayedLogIds.current.add(log.id));
        } else {
          toast.error("Gagal memuat log aktivitas.");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialLogs();

    // --- MEKANISME POLLING DIMULAI DI SINI ---
    const interval = setInterval(async () => {
      // Ambil log terbaru yang ada di state
      const lastLog = logs[0];
      const lastFetchedTimestamp = lastLog ? lastLog.created_at : null;
      
      try {
        // Bertanya ke API: "apakah ada log yang lebih baru dari ini?"
        const response = await fetch(`/api/logs?last_fetched=${encodeURIComponent(lastFetchedTimestamp || '')}`);
        const data = await response.json();

        if (data.success && data.logs.length > 0) {
          const newLogs: Log[] = data.logs;

          // Tampilkan notifikasi dan tambahkan ke state
          newLogs.reverse().forEach(newLog => { // Balik urutan agar notif terlama muncul duluan
            if (!displayedLogIds.current.has(newLog.id)) {
              toast.info(newLog.message, {
                description: `Level: ${newLog.level}`,
                duration: 5000,
              });
              displayedLogIds.current.add(newLog.id);
            }
          });
          
          setLogs(currentLogs => [...newLogs, ...currentLogs]);
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 7000); // Bertanya setiap 7 detik

    // Cleanup: Hentikan interval saat komponen dibongkar
    return () => clearInterval(interval);

  }, [logs]); // useEffect ini akan berjalan lagi jika 'logs' berubah

  if (isLoading) {
    return <div className="text-center text-gray-500">Memuat log...</div>;
  }

  return (
    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
      {logs.length === 0 ? (
        <p className="text-sm text-center text-gray-400 pt-8">Belum ada aktivitas tercatat.</p>
      ) : (
        logs.map(log => (
          <div key={log.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
            <LogIcon level={log.level} />
            <div className="flex-1">
              <p className="text-sm text-gray-800">{log.message}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}