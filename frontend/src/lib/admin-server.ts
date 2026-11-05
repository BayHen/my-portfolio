import "server-only";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/lib/portfolio-api";

export async function adminServerGet<T>(path: string): Promise<T | null> {
  const base = getBackendUrl();
  if (!base) throw new Error("Admin backend is not configured.");
  const cookie = (await cookies()).toString();
  const response = await fetch(new URL(`/api/v1/admin${path}`, base), {
    headers: {
      cookie,
      ...(process.env.ADMIN_PROXY_TOKEN
        ? { "x-admin-proxy-token": process.env.ADMIN_PROXY_TOKEN }
        : {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  }).catch(() => {
    throw new Error("Admin backend is unavailable.");
  });
  if (response.status === 401) return null;
  if (!response.ok)
    throw new Error(`Admin backend returned ${response.status}.`);
  return (await response.json()) as T;
}
