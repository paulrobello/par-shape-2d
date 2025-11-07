import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev', '192.168.1.106', 'localhost', '[::1]', '127.0.0.1', '[::ffff:127.0.0.1]', '0.0.0.0', '[::0]'],
    output: 'export',
    images: {
        unoptimized: true,
    },
    basePath: process.env.NODE_ENV === 'production' ? '' : '',
    trailingSlash: true,
};

export default nextConfig;
