"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button, Input, Textarea } from "@/components/ui/primitives";
import {
  contactLimits,
  validateContact,
  type ContactErrors,
} from "@/lib/contact-validation";

export function ContactForm({ configured }: { configured: boolean }) {
  const [fields, setFields] = useState({
    name: "",
    email: "",
    message: "",
    website: "",
  });
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<
    "idle" | "sending" | "accepted" | "error"
  >("idle");
  const [feedback, setFeedback] = useState("");
  const feedbackRef = useRef<HTMLParagraphElement>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured || status === "sending") return;
    const checked = validateContact(fields);
    setErrors(checked.errors);
    if (!checked.value) {
      setFeedback("Vui lòng sửa các trường được đánh dấu.");
      setStatus("error");
      const first = Object.keys(checked.errors)[0];
      if (first) document.getElementById(`contact-${first}`)?.focus();
      return;
    }
    setStatus("sending");
    setFeedback("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checked.value),
      });
      const result: {
        accepted?: boolean;
        error?: string;
        errors?: ContactErrors;
      } = await response.json();
      if (response.status === 202 && result.accepted) {
        setStatus("accepted");
        setFeedback(
          "Dịch vụ email đã tiếp nhận lời nhắn. Chúng tôi chưa thể xác nhận thư đã được phát tới hộp thư.",
        );
        setFields({ name: "", email: "", message: "", website: "" });
        setErrors({});
        requestAnimationFrame(() => feedbackRef.current?.focus());
      } else {
        setStatus("error");
        setFeedback(
          result.error || "Không thể gửi lời nhắn. Vui lòng thử lại.",
        );
        setErrors(result.errors || {});
        requestAnimationFrame(() => feedbackRef.current?.focus());
      }
    } catch {
      setStatus("error");
      setFeedback("Không thể kết nối. Vui lòng thử lại sau.");
      requestAnimationFrame(() => feedbackRef.current?.focus());
    }
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-describedby="contact-form-note"
      className="mt-7 space-y-5"
    >
      <p id="contact-form-note" className="text-muted text-sm leading-6">
        {configured
          ? "Các trường có dấu * là bắt buộc."
          : "Biểu mẫu chưa được cấu hình dịch vụ email; hiện không thể gửi."}
      </p>
      <div className="absolute -left-[10000px]" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={fields.website}
          onChange={(event) =>
            setFields({ ...fields, website: event.target.value })
          }
        />
      </div>
      <div>
        <label
          htmlFor="contact-name"
          className="mb-2 block text-sm font-semibold"
        >
          Tên *
        </label>
        <Input
          id="contact-name"
          name="name"
          autoComplete="name"
          required
          minLength={2}
          maxLength={contactLimits.name}
          disabled={!configured || status === "sending"}
          value={fields.name}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "contact-name-error" : undefined}
          onChange={(event) =>
            setFields({ ...fields, name: event.target.value })
          }
        />
        {errors.name && (
          <p id="contact-name-error" className="text-accent mt-2 text-sm">
            {errors.name}
          </p>
        )}
      </div>
      <div>
        <label
          htmlFor="contact-email"
          className="mb-2 block text-sm font-semibold"
        >
          Email *
        </label>
        <Input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={contactLimits.email}
          disabled={!configured || status === "sending"}
          value={fields.email}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "contact-email-error" : undefined}
          onChange={(event) =>
            setFields({ ...fields, email: event.target.value })
          }
        />
        {errors.email && (
          <p id="contact-email-error" className="text-accent mt-2 text-sm">
            {errors.email}
          </p>
        )}
      </div>
      <div>
        <label
          htmlFor="contact-message"
          className="mb-2 block text-sm font-semibold"
        >
          Lời nhắn *
        </label>
        <Textarea
          id="contact-message"
          name="message"
          rows={5}
          required
          minLength={10}
          maxLength={contactLimits.message}
          disabled={!configured || status === "sending"}
          value={fields.message}
          aria-invalid={!!errors.message}
          aria-describedby={
            errors.message ? "contact-message-error" : undefined
          }
          onChange={(event) =>
            setFields({ ...fields, message: event.target.value })
          }
        />
        {errors.message && (
          <p id="contact-message-error" className="text-accent mt-2 text-sm">
            {errors.message}
          </p>
        )}
      </div>
      <Button type="submit" disabled={!configured || status === "sending"}>
        {status === "sending" ? "Đang gửi…" : "Gửi lời nhắn"}
      </Button>
      {feedback && (
        <p
          ref={feedbackRef}
          tabIndex={-1}
          role={status === "error" ? "alert" : "status"}
          aria-live={status === "error" ? "assertive" : "polite"}
          className="text-sm leading-6"
        >
          {feedback}
        </p>
      )}
    </form>
  );
}
