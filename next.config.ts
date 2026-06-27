import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/giris',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/kayit',
        permanent: true,
      }
    ]
  }
};

export default nextConfig;
