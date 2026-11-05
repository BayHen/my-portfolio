import { NextRequest, NextResponse } from "next/server";
import {
  allowContactAttempt,
  getContactConfig,
  sendContactEmail,
} from "@/lib/contact";
import { validateContact } from "@/lib/contact-validation";
import { getBackendUrl } from "@/lib/portfolio-api";

export const runtime = "nodejs";

async function readPayload(request: NextRequest): Promise<unknown> {
  if (!request.body) throw new Error("empty");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > 7000) {
      await reader.cancel();
      throw new Error("too_large");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const requestHost = request.headers.get("host");
  const requestProtocol =
    request.headers.get("x-forwarded-proto") ||
    request.nextUrl.protocol.slice(0, -1);
  let sameOrigin = false;
  try {
    const parsed = new URL(origin || "");
    sameOrigin =
      parsed.host === requestHost &&
      parsed.protocol === `${requestProtocol}:`;
  } catch {
    // Missing or malformed Origin must be rejected.
  }
  if (!sameOrigin)
    return NextResponse.json(
      { error: "Nguồn gửi không hợp lệ." },
      { status: 403 },
    );
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return NextResponse.json(
      { error: "Kiểu dữ liệu không hợp lệ." },
      { status: 415 },
    );
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 7000)
    return NextResponse.json({ error: "Nội dung quá dài." }, { status: 413 });
  const backendUrl = getBackendUrl();
  const config = backendUrl ? null : getContactConfig(process.env);
  if (
    (backendUrl && !process.env.BACKEND_CONTACT_PROXY_TOKEN) ||
    (!backendUrl && !config)
  )
    return NextResponse.json(
      { error: "Liên hệ chưa được cấu hình." },
      { status: 503 },
    );
  let payload: unknown;
  try {
    payload = await readPayload(request);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message === "too_large"
            ? "Nội dung quá dài."
            : "Dữ liệu không hợp lệ.",
      },
      {
        status:
          error instanceof Error && error.message === "too_large" ? 413 : 400,
      },
    );
  }
  const { value, errors } = validateContact(payload);
  if (!value)
    return NextResponse.json(
      { error: "Vui lòng kiểm tra thông tin.", errors },
      { status: 400 },
    );
  if (value.website)
    return NextResponse.json(
      { error: "Không thể gửi tin nhắn." },
      { status: 400 },
    );
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!backendUrl && !allowContactAttempt(ip))
    return NextResponse.json(
      { error: "Bạn đã gửi quá nhiều lần. Vui lòng thử lại sau." },
      { status: 429 },
    );
  try {
    if (backendUrl) {
      const response = await fetch(new URL("/api/v1/contact", backendUrl), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key":
            request.headers.get("Idempotency-Key") || crypto.randomUUID(),
          "X-Contact-Proxy-Token": process.env.BACKEND_CONTACT_PROXY_TOKEN!,
          "X-Contact-Client-IP": ip,
        },
        body: JSON.stringify(value),
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      });
      if (!response.ok)
        return NextResponse.json(
          { error: "Không thể lưu lời nhắn. Vui lòng thử lại sau." },
          { status: response.status === 429 ? 429 : 502 },
        );
      const result: { stored?: boolean; notification?: string } =
        await response.json();
      if (!result.stored)
        return NextResponse.json(
          { error: "Backend chưa xác nhận lưu lời nhắn." },
          { status: 502 },
        );
      return NextResponse.json(
        { accepted: true, stored: true, notification: result.notification },
        { status: 202 },
      );
    }
    if (!config) throw new Error("missing contact configuration");
    const result = await sendContactEmail(value, config);
    if (!result.accepted)
      return NextResponse.json(
        {
          error: "Dịch vụ gửi thư chưa xác nhận yêu cầu. Vui lòng thử lại sau.",
        },
        { status: 502 },
      );
    return NextResponse.json({ accepted: true }, { status: 202 });
  } catch {
    return NextResponse.json(
      { error: "Không thể kết nối dịch vụ gửi thư. Vui lòng thử lại sau." },
      { status: 502 },
    );
  }
}
