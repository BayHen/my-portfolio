export function getResumeHref(url?: string): string | null {
  if (!url) return null;
  if (/^\/[a-zA-Z0-9/_-]+\.pdf$/.test(url)) return url;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" &&
      parsed.pathname.toLowerCase().endsWith(".pdf")
      ? url
      : null;
  } catch {
    return null;
  }
}
