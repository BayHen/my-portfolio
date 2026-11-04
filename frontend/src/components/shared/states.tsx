import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

export function LoadingState({ label = "Đang tải" }: { label?: string }) {
  return (
    <div
      role="status"
      className="border-line bg-surface text-muted flex items-center gap-3 rounded-[var(--radius-md)] border p-6"
    >
      <LoaderCircle size={19} className="animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border-line bg-surface rounded-[var(--radius-md)] border p-8">
      <Inbox className="text-accent mb-4" aria-hidden="true" />
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-muted mt-2 text-sm leading-6">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
export function ErrorState({
  title = "Đã xảy ra lỗi",
  description,
  retry,
}: {
  title?: string;
  description?: string;
  retry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="border-line bg-surface rounded-[var(--radius-md)] border p-8"
    >
      <AlertCircle className="text-accent mb-4" aria-hidden="true" />
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-muted mt-2 text-sm leading-6">{description}</p>
      )}
      {retry && (
        <button
          type="button"
          className="text-accent hover:bg-subtle mt-5 min-h-11 rounded-md px-4 font-semibold"
          onClick={retry}
        >
          Thử lại
        </button>
      )}
    </div>
  );
}
