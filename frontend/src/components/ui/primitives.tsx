import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

type Variant = "primary" | "secondary" | "quiet";
const buttonBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] px-5 text-sm font-semibold transition-[background-color,transform,opacity] duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50";
const variants: Record<Variant, string> = {
  primary: "bg-accent text-[var(--accent-contrast)] hover:opacity-85",
  secondary: "border border-line bg-surface text-ink hover:bg-subtle",
  quiet: "text-ink hover:bg-subtle",
};
export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`${buttonBase} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
export function IconButton({
  label,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      className={`border-line bg-surface text-ink hover:bg-subtle inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] border transition-colors ${className}`}
      {...props}
    />
  );
}
export function Container({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mx-auto w-full max-w-[var(--container)] px-5 sm:px-8 lg:px-12 ${className}`}
      {...props}
    />
  );
}
export function Card({
  className = "",
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <article
      className={`border-line bg-surface rounded-[var(--radius-md)] border p-6 shadow-[var(--shadow)] sm:p-8 ${className}`}
      {...props}
    />
  );
}
export function Badge({
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`border-line bg-subtle text-ink inline-flex items-center rounded-full border px-3 py-1 font-mono text-xs font-medium ${className}`}
      {...props}
    />
  );
}
export function Divider({ className = "" }: { className?: string }) {
  return <hr className={`border-line border-0 border-t ${className}`} />;
}
export function SectionHeading({
  eyebrow,
  title,
  description,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={`max-w-2xl ${className}`}>
      {eyebrow && (
        <p className="text-accent mb-3 font-mono text-xs font-semibold tracking-[.16em] uppercase">
          {eyebrow}
        </p>
      )}
      <h2 className="text-ink text-3xl font-semibold tracking-[-.04em] sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="text-muted mt-4 leading-7">{description}</p>
      )}
    </div>
  );
}
const fieldClass =
  "w-full rounded-[var(--radius-sm)] border border-line bg-surface px-4 py-3 text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-[var(--focus)]/30";
export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input className={`${fieldClass} ${props.className ?? ""}`} {...props} />
  );
}
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={`${fieldClass} ${props.className ?? ""}`} {...props} />
  );
}
export function ExternalLink({
  children,
  className = "",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  href: string;
}) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={`text-accent inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline ${className}`}
      {...props}
    >
      {children}
      <span aria-hidden="true">↗</span>
      <span className="sr-only">(mở trong thẻ mới)</span>
    </a>
  );
}
export function ActionLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
}) {
  return (
    <Link href={href} className={`${buttonBase} ${variants[variant]}`}>
      {children}
    </Link>
  );
}
