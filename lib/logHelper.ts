// lib/logHelper.ts
import { supabase } from './supabaseClient';

export async function logActivity(level: 'Info' | 'Peringatan' | 'Kritis', message: string) {
  const { error } = await supabase.from('activity_logs').insert({ level, message });
  if (error) {
    console.error("Gagal mencatat log aktivitas:", error.message);
  }
}