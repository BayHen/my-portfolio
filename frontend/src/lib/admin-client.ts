export type AdminSession = {
  email: string;
  csrf_token: string;
  expires_at: string;
};

export class AdminAuthenticationError extends Error {
  constructor() {
    super("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    this.name = "AdminAuthenticationError";
  }
}

export async function adminRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = options.method?.toUpperCase() || "GET";
  const headers = new Headers(options.headers);
  if (!["GET", "HEAD"].includes(method)) {
    const sessionResponse = await fetch("/api/admin/session", {
      cache: "no-store",
    });
    if (sessionResponse.status === 401) throw new AdminAuthenticationError();
    if (!sessionResponse.ok)
      throw new Error("Không thể kiểm tra phiên đăng nhập. Vui lòng thử lại.");
    const session = (await sessionResponse.json()) as AdminSession;
    headers.set("X-CSRF-Token", session.csrf_token);
  }
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  const response = await fetch(`/api/admin${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });
  if (response.status === 401) throw new AdminAuthenticationError();
  if (response.status === 204) return undefined as T;
  const result = await response.json();
  if (!response.ok) {
    const error = result?.error;
    throw new Error(
      typeof error === "string" ? error : error?.message || "Yêu cầu thất bại.",
    );
  }
  return result as T;
}
