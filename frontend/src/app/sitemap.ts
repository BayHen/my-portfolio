import type { MetadataRoute } from "next";
import { loadProjects } from "@/lib/portfolio-api";
import { getSiteUrl, isIndexable } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  if (!siteUrl || !isIndexable()) return [];
  let projects;
  try {
    projects = await loadProjects();
  } catch {
    return [];
  }
  const paths = [
    "/",
    "/projects",
    "/about",
    "/contact",
    ...projects.map((project) => `/projects/${project.slug}`),
  ];
  return paths.map((path) => ({ url: new URL(path, siteUrl).toString() }));
}
