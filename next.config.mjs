/** @type {import('next').NextConfig} */
const nextConfig = {
  // A raiz "/" serve a landing page estática (public/landing.html).
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", destination: "/landing.html" }],
    };
  },
};

export default nextConfig;
