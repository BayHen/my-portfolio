export const contactLimits = { name: 100, email: 254, message: 5000 } as const;

export type ContactInput = {
  name: string;
  email: string;
  message: string;
  website?: string;
};
export type ContactErrors = Partial<
  Record<"name" | "email" | "message", string>
>;

export function validateContact(input: unknown): {
  value?: ContactInput;
  errors: ContactErrors;
} {
  const data =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim() : "";
  const message = typeof data.message === "string" ? data.message.trim() : "";
  const website = typeof data.website === "string" ? data.website.trim() : "";
  const errors: ContactErrors = {};
  if (name.length < 2 || name.length > contactLimits.name)
    errors.name = `Tên phải có 2–${contactLimits.name} ký tự.`;
  if (
    email.length > contactLimits.email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  )
    errors.email = "Nhập địa chỉ email hợp lệ.";
  if (message.length < 10 || message.length > contactLimits.message)
    errors.message = `Lời nhắn phải có 10–${contactLimits.message} ký tự.`;
  return {
    value: Object.keys(errors).length
      ? undefined
      : { name, email, message, website },
    errors,
  };
}

export type ContactConfig = { apiKey: string; from: string; to: string };
export function getContactConfig(env: NodeJS.ProcessEnv): ContactConfig | null {
  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.CONTACT_FROM_EMAIL?.trim();
  const to = env.CONTACT_TO_EMAIL?.trim();
  return apiKey && from && to ? { apiKey, from, to } : null;
}

export async function sendContactEmail(
  input: ContactInput,
  config: ContactConfig,
  fetcher: typeof fetch = fetch,
): Promise<{ accepted: boolean }> {
  const response = await fetcher("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.from,
      to: [config.to],
      reply_to: input.email,
      subject: `DEVFOLIO contact: ${input.name.replace(/[\r\n]/g, " ")}`,
      text: `Name: ${input.name}\nEmail: ${input.email}\n\n${input.message}`,
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return { accepted: false };
  const result: unknown = await response.json();
  return {
    accepted:
      !!result &&
      typeof result === "object" &&
      typeof (result as { id?: unknown }).id === "string",
  };
}

const attempts = new Map<string, { count: number; resetAt: number }>();
export function allowContactAttempt(key: string, now = Date.now()): boolean {
  if (attempts.size > 1000)
    for (const [id, item] of attempts)
      if (item.resetAt <= now) attempts.delete(id);
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + 10 * 60_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count += 1;
  return true;
}
