import Link from "next/link";
import { adminServerGet } from "@/lib/admin-server";
import { AdminHeading } from "@/components/admin/admin-ui";

export default async function AdminHome() {
  const overview = await adminServerGet<{
    projects: number;
    drafts: number;
    messages_unread: number;
  }>("/overview");
  const cards = [
    { label: "Dự án", value: overview?.projects ?? 0, href: "/admin/projects" },
    {
      label: "Bản nháp",
      value: overview?.drafts ?? 0,
      href: "/admin/projects",
    },
    {
      label: "Lời nhắn chưa đọc",
      value: overview?.messages_unread ?? 0,
      href: "/admin/messages",
    },
  ];
  return (
    <>
      <AdminHeading
        title="Tổng quan"
        description="Theo dõi nội dung trước khi xuất bản và quản lý lời nhắn riêng tư."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="border-line bg-surface hover:border-accent rounded-xl border p-6 transition-colors"
          >
            <p className="text-muted text-sm">{card.label}</p>
            <p className="mt-5 text-4xl font-semibold">{card.value}</p>
          </Link>
        ))}
      </div>
      <p className="text-muted mt-8 text-sm">
        Nội dung mới được lưu thành bản nháp. Chọn xuất bản khi thông tin đã
        được xác minh.
      </p>
    </>
  );
}
