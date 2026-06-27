import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gestalize Finance",
    short_name: "Gestalize",
    description: "Sistema financeiro e de cobranças da Gestalize Systems",
    start_url: "/",
    display: "standalone",
    background_color: "#070b16",
    theme_color: "#0b1020",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
