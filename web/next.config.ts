import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, "../src");

const nextConfig: NextConfig = {
  typescript: {
    // Source files in ../src/ are type-checked by the root tsconfig.
    // Skip re-checking them here since the web tsconfig has different settings.
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  outputFileTracingRoot: path.resolve(__dirname, ".."),
  transpilePackages: [srcDir],
  serverExternalPackages: ["yahoo-finance2", "technicalindicators"],
  webpack(config) {
    config.resolve.alias["@finance"] = srcDir;
    // The source files use .js extensions in imports (NodeNext resolution).
    // Webpack with bundler resolution needs to resolve .ts files for .js imports.
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js", ".jsx"],
    };
    return config;
  },
};

export default nextConfig;
