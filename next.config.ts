import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    // TDX 觀光署照片來源 + 其他常見台灣旅遊資料來源
    remotePatterns: [
      { protocol: "https", hostname: "media.taiwan.net.tw" },
      { protocol: "https", hostname: "**.taiwan.net.tw" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google Places
      { protocol: "https", hostname: "**.supabase.co" }, // Supabase Storage (未來 UGC)
    ],
  },
};

export default nextConfig;
