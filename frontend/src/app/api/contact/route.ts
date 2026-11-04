import { NextRequest, NextResponse } from "next/server";
import {
  allowContactAttempt,
  getContactConfig,
  sendContactEmail,
  validateContact,
} from "@/lib/contact";

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
  if (!origin || origin !== request.nextUrl.origin)
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
  const config = getContactConfig(process.env);
  if (!config)
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
  if (!allowContactAttempt(ip))
    return NextResponse.json(
      { error: "Bạn đã gửi quá nhiều lần. Vui lòng thử lại sau." },
      { status: 429 },
    );
  try {
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
