import type { Metadata } from "next";
import { profile } from "@/content/profile";
import { projects } from "@/content/projects";

export function getSiteUrl(env: NodeJS.ProcessEnv = process.env): URL | null {
  const raw = env.SITE_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (
      url.protocol !== "https:" &&
      !(
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(url.hostname)
      )
    )
      return null;
    if (
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/"
    )
      return null;
    return url;
  } catch {
    return null;
  }
}

export function isIndexable(env: NodeJS.ProcessEnv = process.env): boolean {
  return (
    !!getSiteUrl(env) &&
    !profile.placeholder &&
    projects.every((project) => !project.placeholder)
  );
}

export function pageMetadata(
  title: string,
  description: string,
  path: string,
  published = true,
): Metadata {
  const siteUrl = getSiteUrl();
  const index = isIndexable() && published;
  const url = siteUrl ? new URL(path, siteUrl).toString() : undefined;
  return {
    title,
    description,
    ...(siteUrl
      ? { metadataBase: siteUrl, alternates: { canonical: url } }
      : {}),
    robots: { index, follow: index, googleBot: { index, follow: index } },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "vi_VN",
      siteName: "DEVFOLIO",
      ...(url ? { url } : {}),
    },
    twitter: { card: "summary", title, description },
  };
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
