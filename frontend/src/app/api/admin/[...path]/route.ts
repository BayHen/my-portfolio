import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getBackendUrl } from "@/lib/portfolio-api";

export const runtime = "nodejs";

type Context = { params: Promise<{ path: string[] }> };

async function proxy(request: NextRequest, context: Context) {
  const base = getBackendUrl();
  if (!base)
    return NextResponse.json(
      { error: "Backend chưa được cấu hình." },
      { status: 503 },
    );
  const { path } = await context.params;
  if (!path.length || path.some((part) => part === "." || part === ".."))
    return NextResponse.json(
      { error: "Đường dẫn không hợp lệ." },
      { status: 400 },
    );
  const write = !["GET", "HEAD"].includes(request.method);
  const origin = request.headers.get("origin");
  const requestHost = request.headers.get("host");
  const requestProtocol =
    request.headers.get("x-forwarded-proto") ||
    request.nextUrl.protocol.slice(0, -1);
  let sameOrigin = false;
  try {
    const parsed = new URL(origin || "");
    sameOrigin =
      parsed.host === requestHost && parsed.protocol === `${requestProtocol}:`;
  } catch {
    /* Reject malformed or missing Origin on writes. */
  }
  if (write && !sameOrigin)
    return NextResponse.json(
      { error: "Nguồn gửi không hợp lệ." },
      { status: 403 },
    );
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 5_500_000)
    return NextResponse.json({ error: "Nội dung quá lớn." }, { status: 413 });
  const target = new URL(
    `/api/v1/admin/${path.map(encodeURIComponent).join("/")}`,
    base,
  );
  target.search = request.nextUrl.search;
  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);
  const csrf = request.headers.get("x-csrf-token");
  if (csrf) headers.set("x-csrf-token", csrf);
  const type = request.headers.get("content-type");
  if (type) headers.set("content-type", type);
  const proxyToken = process.env.ADMIN_PROXY_TOKEN;
  if (proxyToken) headers.set("x-admin-proxy-token", proxyToken);
  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: write ? await request.arrayBuffer() : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const response = new NextResponse(upstream.body, {
      status: upstream.status,
    });
    response.headers.set("Cache-Control", "private, no-store");
    const responseType = upstream.headers.get("content-type");
    if (responseType) response.headers.set("content-type", responseType);
    const setCookie = upstream.headers.get("set-cookie");
    if (setCookie) response.headers.set("set-cookie", setCookie);
    if (write && upstream.ok && path[0] === "media")
      revalidatePath("/", "layout");
    return response;
  } catch {
    return NextResponse.json(
      { error: "Không thể kết nối backend." },
      { status: 503 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
