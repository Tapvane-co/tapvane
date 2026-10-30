import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tapvane.com";

// The public pages for search engines. (Individual customer profiles are not listed: they are personal
// pages that people share by link or by tapping a card.)
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: { path: string; priority: number }[] = [
    { path: "", priority: 1 },
    { path: "/packages", priority: 0.9 },
    { path: "/how-it-works", priority: 0.8 },
    { path: "/customise", priority: 0.7 },
    { path: "/faq", priority: 0.7 },
    { path: "/contact", priority: 0.6 },
    { path: "/p/tapvane", priority: 0.5 },
    { path: "/terms", priority: 0.3 },
    { path: "/privacy", priority: 0.3 },
  ];
  return pages.map((p) => ({ url: `${siteUrl}${p.path}`, priority: p.priority }));
}
