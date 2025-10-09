import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: [
          '/api/',
          '/admin/',
          '/account/',
          '/dashboard/',
          '/record/',
          '/analysis/',
          '/history/',
          '/settings/',
          '/subscription/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
