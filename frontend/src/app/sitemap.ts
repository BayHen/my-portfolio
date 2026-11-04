import type { MetadataRoute } from "next";
import { projects } from "@/content/projects";
import { getSiteUrl, isIndexable } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  if (!siteUrl || !isIndexable()) return [];
  const paths = [
    "/",
    "/projects",
    "/about",
    "/contact",
    ...projects.map((project) => `/projects/${project.slug}`),
  ];
  return paths.map((path) => ({ url: new URL(path, siteUrl).toString() }));
}
