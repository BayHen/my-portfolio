import { afterEach, describe, expect, it, vi } from "vitest";
import { adminRequest, AdminAuthenticationError } from "@/lib/admin-client";

afterEach(() => vi.unstubAllGlobals());

describe("admin session requests", () => {
  it("stops a write when the session expired", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      adminRequest("/projects", { method: "POST", body: JSON.stringify({ title: "Test" }) }),
    ).rejects.toBeInstanceOf(AdminAuthenticationError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/session", { cache: "no-store" });
  });

  it("distinguishes unavailable session service from unauthorized", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));

    await expect(adminRequest("/projects", { method: "POST" })).rejects.toThrow(
      "Không thể kiểm tra phiên đăng nhập",
    );
  });

  it("reports a protected read without a cookie as unauthorized", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 401 })));

    await expect(adminRequest("/projects")).rejects.toBeInstanceOf(
      AdminAuthenticationError,
    );
  });
});
