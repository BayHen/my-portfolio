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
