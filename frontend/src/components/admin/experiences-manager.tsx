"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  AdminHeading,
  AdminLoading,
  ConfirmButton,
  Field,
  Notice,
} from "@/components/admin/admin-ui";
import { Button, Input } from "@/components/ui/primitives";
import { adminRequest } from "@/lib/admin-client";

type Experience = {
  id: number;
  role: string;
  organization: string;
  summary: string;
  start_date: string;
  end_date: string | null;
  current: boolean;
  position: number;
  published_at: string | null;
};
const blank: Experience = {
  id: 0,
  role: "",
  organization: "",
  summary: "",
  start_date: "",
  end_date: null,
  current: false,
  position: 0,
  published_at: null,
};

export function ExperiencesManager() {
  const [items, setItems] = useState<Experience[]>([]);
  const [editing, setEditing] = useState<Experience>(blank);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    try {
      const data = await adminRequest<Experience[]>("/experiences");
      setItems(data);
      setEditing(
        (current) => data.find((item) => item.id === current.id) || current,
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không thể tải kinh nghiệm.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
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
  async function save(event: FormEvent) {
    event.preventDefault();
    await act(async () => {
      const result = await adminRequest<Experience>(
        editing.id ? `/experiences/${editing.id}` : "/experiences",
        {
          method: editing.id ? "PUT" : "POST",
          body: JSON.stringify({
            ...editing,
            end_date: editing.current ? null : editing.end_date || null,
          }),
        },
      );
      setEditing(result);
    }, "Đã lưu kinh nghiệm.");
  }
  if (loading) return <AdminLoading />;
  return (
    <>
      <AdminHeading
        title="Kinh nghiệm"
        description="Chỉ xuất bản những mốc học tập hoặc công việc đã được xác minh."
      />
      <div className="grid gap-7 lg:grid-cols-[16rem_1fr]">
        <section className="border-line bg-surface h-fit rounded-xl border p-4">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setEditing(blank)}
          >
            + Mục mới
          </Button>
          <ul className="mt-4">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  className="hover:bg-subtle w-full rounded-lg p-3 text-left text-sm"
                  onClick={() => setEditing(item)}
                >
                  <span className="block font-medium">{item.role}</span>
                  <span className="text-muted text-xs">
                    {item.organization} ·{" "}
                    {item.published_at ? "Đã xuất bản" : "Bản nháp"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {!items.length && (
            <p className="text-muted mt-4 text-sm">Chưa có mục nào.</p>
          )}
        </section>
        <form
          onSubmit={save}
          className="border-line bg-surface space-y-5 rounded-xl border p-6"
        >
          <h2 className="text-xl font-semibold">
            {editing.id ? "Chỉnh sửa" : "Mục mới"}
          </h2>
          <Field
            name="experience-role"
            label="Vai trò / tiêu đề"
            value={editing.role}
            onChange={(role) => setEditing({ ...editing, role })}
            required
          />
          <Field
            name="experience-organization"
            label="Tổ chức"
            value={editing.organization}
            onChange={(organization) =>
              setEditing({ ...editing, organization })
            }
            required
          />
          <Field
            name="experience-summary"
            label="Mô tả"
            value={editing.summary}
            onChange={(summary) => setEditing({ ...editing, summary })}
            multiline
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              name="experience-start"
              label="Ngày bắt đầu"
              value={editing.start_date}
              onChange={(start_date) => setEditing({ ...editing, start_date })}
              type="date"
              required
            />
            <Field
              name="experience-end"
              label="Ngày kết thúc"
              value={editing.end_date || ""}
              onChange={(end_date) => setEditing({ ...editing, end_date })}
              type="date"
            />
          </div>
          <label className="flex min-h-11 items-center gap-3">
            <input
              type="checkbox"
              checked={editing.current}
              onChange={(event) =>
                setEditing({
                  ...editing,
                  current: event.target.checked,
                  end_date: event.target.checked ? null : editing.end_date,
                })
              }
            />{" "}
            Hiện tại
          </label>
          <div>
            <label
              htmlFor="experience-position"
              className="mb-2 block text-sm font-medium"
            >
              Thứ tự hiển thị
            </label>
            <Input
              id="experience-position"
              type="number"
              min={0}
              value={editing.position}
              onChange={(event) =>
                setEditing({ ...editing, position: Number(event.target.value) })
              }
            />
          </div>
          <Notice message={error} error />
          <Notice message={notice} />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy}>
              Lưu
            </Button>
            {editing.id > 0 && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() =>
                    act(
                      () =>
                        adminRequest(
                          `/experiences/${editing.id}/${editing.published_at ? "unpublish" : "publish"}`,
                          { method: "POST" },
                        ),
                      "Đã cập nhật trạng thái.",
                    )
                  }
                >
                  {editing.published_at ? "Hủy xuất bản" : "Xuất bản"}
                </Button>
                <ConfirmButton
                  label="Xóa"
                  confirmText="Xóa mục này?"
                  disabled={busy}
                  onConfirm={() =>
                    act(async () => {
                      await adminRequest(`/experiences/${editing.id}`, {
                        method: "DELETE",
                      });
                      setEditing(blank);
                    }, "Đã xóa.")
                  }
                />
              </>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
