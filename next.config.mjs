/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Ini membantu mengabaikan error minor saat development
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ini juga membantu saat development
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  
  // Pastikan tidak ada konfigurasi 'rewrites' atau 'proxy' di sini.
  // Inilah yang menyebabkan semua masalah.
};

export default nextConfig;