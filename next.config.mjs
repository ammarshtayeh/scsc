import path from "path";

const distDir = process.env.NEXT_DIST_DIR?.trim();

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(distDir ? { distDir } : {}),
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
        ]
      }
    ];
  },
  images: {
    unoptimized: true
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "firebase/app$": path.resolve(
        process.cwd(),
        "node_modules/firebase/app/dist/esm/index.esm.js"
      ),
      "firebase/auth$": path.resolve(
        process.cwd(),
        "node_modules/firebase/auth/dist/esm/index.esm.js"
      ),
      "firebase/firestore$": path.resolve(
        process.cwd(),
        "node_modules/firebase/firestore/dist/esm/index.esm.js"
      ),
      "firebase/functions$": path.resolve(
        process.cwd(),
        "node_modules/firebase/functions/dist/esm/index.esm.js"
      ),
      "firebase/storage$": path.resolve(
        process.cwd(),
        "node_modules/firebase/storage/dist/esm/index.esm.js"
      ),
      "framer-motion$": path.resolve(
        process.cwd(),
        "node_modules/framer-motion/dist/cjs/index.js"
      )
    };

    return config;
  }
};

export default nextConfig;
