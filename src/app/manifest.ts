import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hema's Boutique | Women's Ethnic Wear & Designer Kurtis",
    short_name: "Hema's Boutique",
    description: "Authentic designer kurtis, maternity feeding wear, and contemporary ethnic fashion.",
    start_url: '/',
    display: 'standalone',
    background_color: '#FDFBF7',
    theme_color: '#8A1A38',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
