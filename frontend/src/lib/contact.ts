import type { ContactInput } from "./contact-validation.ts";

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
