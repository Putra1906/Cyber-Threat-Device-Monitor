/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // GANTI BAGIAN REWRITES DENGAN INI:
  async rewrites() {
    return [
      // Proxy untuk semua rute API biasa (GET, POST JSON)
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:5000/api/:path*',
      },
      // Proxy KHUSUS untuk unggah excel
      {
        source: '/upload_excel',
        destination: 'http://127.0.0.1:5000/upload_excel',
      },
    ];
  },
};

export default nextConfig;