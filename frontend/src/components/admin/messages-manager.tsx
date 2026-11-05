"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminHeading,
  AdminLoading,
  ConfirmButton,
  Notice,
} from "@/components/admin/admin-ui";
import { Button, Input } from "@/components/ui/primitives";
import { adminRequest } from "@/lib/admin-client";

type Message = {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
  read_at: string | null;
  notification_status: string;
};

export function MessagesManager() {
  const [items, setItems] = useState<Message[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    try {
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (filter !== "all")
        query.set("read", filter === "read" ? "true" : "false");
      setItems(await adminRequest<Message[]>(`/messages?${query}`));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không thể tải lời nhắn.",
      );
    } finally {
      setLoading(false);
    }
  }, [search, filter]);
  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);
  async function act(task: () => Promise<unknown>, success: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await task();
      await load();
      setNotice(success);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Thao tác thất bại.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <AdminHeading
        title="Lời nhắn"
        description="Thông tin liên hệ là dữ liệu riêng tư. Chỉ tài khoản quản trị được đọc và xử lý."
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <label htmlFor="message-search" className="sr-only">
            Tìm theo tên hoặc email
          </label>
          <Input
            id="message-search"
            placeholder="Tìm tên hoặc email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="message-filter" className="sr-only">
            Lọc trạng thái
          </label>
          <select
            id="message-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="border-line bg-surface min-h-11 rounded-lg border px-4"
          >
            <option value="all">Tất cả</option>
            <option value="unread">Chưa đọc</option>
            <option value="read">Đã đọc</option>
          </select>
        </div>
      </div>
      <Notice message={error} error />
      <Notice message={notice} />
      {loading ? (
        <AdminLoading />
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <article
              key={item.id}
              className="border-line bg-surface rounded-xl border p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">
                    {item.name}{" "}
                    <span className="text-muted font-normal">
                      · {item.email}
                    </span>
                  </h2>
                  <p className="text-muted mt-1 text-xs">
                    {new Date(item.created_at).toLocaleString("vi-VN")} ·{" "}
                    {item.read_at ? "Đã đọc" : "Chưa đọc"} · Thông báo:{" "}
                    {item.notification_status}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() =>
                      act(
                        () =>
                          adminRequest(`/messages/${item.id}`, {
                            method: "PATCH",
                            body: JSON.stringify({ read: !item.read_at }),
                          }),
                        "Đã cập nhật trạng thái.",
                      )
                    }
                  >
                    {item.read_at ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}
                  </Button>
                  <ConfirmButton
                    label="Xóa"
                    confirmText="Xóa lời nhắn?"
                    disabled={busy}
                    onConfirm={() =>
                      act(
                        () =>
                          adminRequest(`/messages/${item.id}`, {
                            method: "DELETE",
                          }),
                        "Đã xóa lời nhắn.",
                      )
                    }
                  />
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 break-words whitespace-pre-wrap">
                {item.message}
              </p>
            </article>
          ))}
          {!items.length && (
            <p className="border-line bg-surface rounded-xl border p-8 text-center">
              Không có lời nhắn phù hợp.
            </p>
          )}
        </div>
      )}
    </>
  );
}
