import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tapvane.com";

// Tells search engines what they may look at. Private areas (admin, dashboard, checkout) are kept out.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/checkout", "/cart", "/api/", "/activate/", "/c/", "/reset-password"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
