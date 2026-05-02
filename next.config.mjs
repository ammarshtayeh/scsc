import path from "path";

const distDir = process.env.NEXT_DIST_DIR?.trim();

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(distDir ? { distDir } : {}),
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
