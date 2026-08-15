/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    // We keep media as plain <img>/<video> with placeholders, so no remote
    // image domains are needed. Safe for static + PWA hosting.
  },
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
