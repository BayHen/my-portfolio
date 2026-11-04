import type { MetadataRoute } from "next";
import { getSiteUrl, isIndexable } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  if (!siteUrl || !isIndexable())
    return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
