"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  AdminHeading,
  AdminLoading,
  ConfirmButton,
  Field,
  Notice,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/primitives";
import { adminRequest } from "@/lib/admin-client";

type Technology = {
  id: number;
  name: string;
  category: string;
  group: string | null;
};
const blank: Technology = { id: 0, name: "", category: "tool", group: "Tools" };

export function TechnologiesManager() {
  const [items, setItems] = useState<Technology[]>([]);
  const [editing, setEditing] = useState<Technology>(blank);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    try {
      setItems(await adminRequest<Technology[]>("/technologies"));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không thể tải dữ liệu.",
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
      await adminRequest(
        editing.id ? `/technologies/${editing.id}` : "/technologies",
        {
          method: editing.id ? "PUT" : "POST",
          body: JSON.stringify({
            name: editing.name,
            category: editing.category,
            group: editing.group || null,
          }),
        },
      );
      setEditing(blank);
    }, "Đã lưu công nghệ.");
  }
  if (loading) return <AdminLoading />;
  return (
    <>
      <AdminHeading
        title="Công nghệ"
        description="Công nghệ được gán cho dự án. Không thể xóa mục còn được sử dụng."
      />
      <div className="grid gap-7 lg:grid-cols-[1fr_22rem]">
        <section className="border-line bg-surface overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[30rem] text-left text-sm">
            <thead className="bg-subtle">
              <tr>
                <th className="p-4">Tên</th>
                <th className="p-4">Loại</th>
                <th className="p-4">Nhóm</th>
                <th className="p-4">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-line border-t">
                  <td className="p-4 font-medium">{item.name}</td>
                  <td className="p-4">{item.category}</td>
                  <td className="p-4">{item.group || "—"}</td>
                  <td className="p-4">
                    <Button variant="quiet" onClick={() => setEditing(item)}>
                      Sửa
                    </Button>
                    <ConfirmButton
                      label="Xóa"
                      confirmText="Xóa công nghệ?"
                      disabled={busy}
                      onConfirm={() =>
                        act(
                          () =>
                            adminRequest(`/technologies/${item.id}`, {
                              method: "DELETE",
                            }),
                          "Đã xóa công nghệ.",
                        )
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!items.length && (
            <p className="text-muted p-6">Chưa có công nghệ.</p>
          )}
        </section>
        <form
          onSubmit={save}
          className="border-line bg-surface h-fit space-y-5 rounded-xl border p-6"
        >
          <h2 className="text-lg font-semibold">
            {editing.id ? "Sửa công nghệ" : "Thêm công nghệ"}
          </h2>
          <Field
            name="technology-name"
            label="Tên"
            value={editing.name}
            onChange={(name) => setEditing({ ...editing, name })}
            required
          />
          <div>
            <label
              htmlFor="technology-category"
              className="mb-2 block text-sm font-medium"
            >
              Loại
            </label>
            <select
              id="technology-category"
              value={editing.category}
              onChange={(event) =>
                setEditing({ ...editing, category: event.target.value })
              }
              className="border-line bg-surface w-full rounded-lg border p-3"
            >
              {["language", "framework", "database", "tool"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="technology-group"
              className="mb-2 block text-sm font-medium"
            >
              Nhóm
            </label>
            <select
              id="technology-group"
              value={editing.group || ""}
              onChange={(event) =>
                setEditing({ ...editing, group: event.target.value })
              }
              className="border-line bg-surface w-full rounded-lg border p-3"
            >
              {["Backend", "Frontend", "Database", "DevOps", "Tools"].map(
                (value) => (
                  <option key={value}>{value}</option>
                ),
              )}
            </select>
          </div>
          <Notice message={error} error />
          <Notice message={notice} />
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>
              Lưu
            </Button>
            {editing.id > 0 && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditing(blank)}
              >
                Hủy
              </Button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
