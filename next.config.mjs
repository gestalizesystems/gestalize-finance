/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone: emite apenas os arquivos necessários para rodar, sem o
  // node_modules completo — reduz significativamente o uso de memória em prod.
  output: "standalone",

  // A raiz "/" serve a landing page estática (public/landing.html).
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", destination: "/landing.html" }],
    };
  },
};

export default nextConfig;
