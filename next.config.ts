import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    serverExternalPackages: ["@prisma/client", "bcryptjs"],
    transpilePackages: ["next-auth"],
};

export default nextConfig;
