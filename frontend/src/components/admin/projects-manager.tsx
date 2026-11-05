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

type Technology = { id: number; name: string; category: string };
type Image = { id: number; src: string; alt: string; position: number };
type Project = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: string | null;
  status: string;
  is_featured: boolean;
  published_at: string | null;
  technology_ids: number[];
  images: Image[];
  problem: string | null;
  solution: string | null;
  architecture: string | null;
  challenges: string | null;
  testing: string | null;
  results: string | null;
  repository_url: string | null;
  live_url: string | null;
  goals: string[] | null;
  responsibilities: string[] | null;
  features: string[] | null;
  lessons_learned: string | null;
};
const blank: Project = {
  id: 0,
  slug: "",
  title: "",
  summary: "",
  description: "",
  category: "",
  status: "draft",
  is_featured: false,
  published_at: null,
  technology_ids: [],
  images: [],
  problem: "",
  solution: "",
  architecture: "",
  challenges: "",
  testing: "",
  results: "",
  repository_url: "",
  live_url: "",
  goals: [],
  responsibilities: [],
  features: [],
  lessons_learned: "",
};
type TextField =
  | "slug"
  | "title"
  | "summary"
  | "description"
  | "category"
  | "status"
  | "problem"
  | "solution"
  | "architecture"
  | "challenges"
  | "testing"
  | "results"
  | "repository_url"
  | "live_url"
  | "lessons_learned";
const fields: {
  key: TextField;
  label: string;
  multiline?: boolean;
  required?: boolean;
}[] = [
  { key: "title", label: "Tên dự án", required: true },
  { key: "slug", label: "Slug", required: true },
  { key: "summary", label: "Tóm tắt", multiline: true, required: true },
  { key: "description", label: "Mô tả", multiline: true, required: true },
  { key: "category", label: "Danh mục" },
  { key: "status", label: "Nhãn trạng thái" },
];
const details: { key: TextField; label: string; multiline?: boolean }[] = [
  { key: "problem", label: "Vấn đề", multiline: true },
  { key: "solution", label: "Giải pháp", multiline: true },
  { key: "architecture", label: "Kiến trúc", multiline: true },
  { key: "challenges", label: "Thách thức", multiline: true },
  { key: "testing", label: "Kiểm thử", multiline: true },
  { key: "results", label: "Kết quả", multiline: true },
  { key: "lessons_learned", label: "Bài học", multiline: true },
  { key: "repository_url", label: "Repository URL" },
  { key: "live_url", label: "Live URL" },
];

export function ProjectsManager() {
  const [items, setItems] = useState<Project[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [editing, setEditing] = useState<Project>(blank);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const [projects, tech] = await Promise.all([
        adminRequest<Project[]>("/projects"),
        adminRequest<Technology[]>("/technologies"),
      ]);
      setItems(projects);
      setTechnologies(tech);
      setEditing(
        (current) =>
          projects.find((project) => project.id === current.id) || current,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải dự án.");
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
  function update(key: TextField, value: string) {
    setEditing((current) => ({ ...current, [key]: value }));
  }
  function listValue(key: "goals" | "responsibilities" | "features") {
    return (editing[key] || []).join("\n");
  }
  function updateList(
    key: "goals" | "responsibilities" | "features",
    value: string,
  ) {
    setEditing((current) => ({
      ...current,
      [key]: value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    }));
  }
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
    const payload = {
      ...editing,
      id: undefined,
      images: undefined,
      published_at: undefined,
      category: editing.category || null,
      repository_url: editing.repository_url || null,
      live_url: editing.live_url || null,
    };
    await act(
      async () => {
        const result = await adminRequest<Project>(
          editing.id ? `/projects/${editing.id}` : "/projects",
          {
            method: editing.id ? "PUT" : "POST",
            body: JSON.stringify(payload),
          },
        );
        setEditing(result);
      },
      editing.published_at ? "Đã lưu thay đổi công khai." : "Đã lưu bản nháp.",
    );
  }
  async function remove() {
    await act(async () => {
      await adminRequest(`/projects/${editing.id}`, { method: "DELETE" });
      setEditing(blank);
    }, "Đã xóa dự án.");
  }
  async function moveImage(imageId: number, direction: -1 | 1) {
    const ids = [...editing.images]
      .sort((a, b) => a.position - b.position)
      .map((image) => image.id);
    const index = ids.indexOf(imageId);
    const other = index + direction;
    if (other < 0 || other >= ids.length) return;
    [ids[index], ids[other]] = [ids[other], ids[index]];
    await act(
      () =>
        adminRequest(`/projects/${editing.id}/images/order`, {
          method: "PUT",
          body: JSON.stringify({ image_ids: ids }),
        }),
      "Đã đổi thứ tự.",
    );
  }
  if (loading) return <AdminLoading />;
  return (
    <>
      <AdminHeading
        title="Dự án"
        description="Soạn case study, quản lý công nghệ và hình ảnh. Thay đổi chỉ công khai sau khi chọn xuất bản."
      />
      <div className="grid gap-8 xl:grid-cols-[16rem_minmax(0,1fr)]">
        <section
          aria-label="Danh sách dự án"
          className="border-line bg-surface h-fit rounded-xl border p-4"
        >
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setEditing(blank)}
          >
            + Dự án mới
          </Button>
          <ul className="mt-4 space-y-1">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setEditing(item)}
                  className={`hover:bg-subtle w-full rounded-lg p-3 text-left text-sm ${editing.id === item.id ? "bg-subtle" : ""}`}
                >
                  <span className="block font-medium">{item.title}</span>
                  <span className="text-muted mt-1 block text-xs">
                    {item.published_at ? "Đã xuất bản" : "Bản nháp"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {!items.length && (
            <p className="text-muted mt-5 text-sm">Chưa có dự án.</p>
          )}
        </section>
        <section className="border-line bg-surface min-w-0 rounded-xl border p-5 sm:p-7">
          <h2 className="mb-6 text-xl font-semibold">
            {editing.id ? `Chỉnh sửa: ${editing.title}` : "Dự án mới"}
          </h2>
          <form onSubmit={save} className="space-y-5">
            {fields.map((field) => (
              <Field
                key={field.key}
                name={`project-${field.key}`}
                label={field.label}
                required={field.required}
                multiline={field.multiline}
                value={String(editing[field.key] || "")}
                onChange={(value) => update(field.key, value)}
              />
            ))}
            <label className="flex min-h-11 items-center gap-3">
              <input
                type="checkbox"
                checked={editing.is_featured}
                onChange={(event) =>
                  setEditing({ ...editing, is_featured: event.target.checked })
                }
              />{" "}
              Dự án nổi bật
            </label>
            <fieldset className="border-line rounded-lg border p-4">
              <legend className="px-2 font-medium">Công nghệ</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {technologies.map((tech) => (
                  <label
                    key={tech.id}
                    className="flex min-h-11 items-center gap-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={editing.technology_ids.includes(tech.id)}
                      onChange={(event) =>
                        setEditing({
                          ...editing,
                          technology_ids: event.target.checked
                            ? [...editing.technology_ids, tech.id]
                            : editing.technology_ids.filter(
                                (id) => id !== tech.id,
                              ),
                        })
                      }
                    />
                    {tech.name}
                  </label>
                ))}
              </div>
              {!technologies.length && (
                <p className="text-muted text-sm">
                  Thêm công nghệ ở mục Công nghệ.
                </p>
              )}
            </fieldset>
            <details className="border-line rounded-lg border p-4">
              <summary className="cursor-pointer font-medium">
                Nội dung case study
              </summary>
              <div className="mt-5 space-y-5">
                {details.map((field) => (
                  <Field
                    key={field.key}
                    name={`project-${field.key}`}
                    label={field.label}
                    multiline={field.multiline}
                    value={String(editing[field.key] || "")}
                    onChange={(value) => update(field.key, value)}
                  />
                ))}
                {(["goals", "responsibilities", "features"] as const).map(
                  (key) => (
                    <div key={key}>
                      <label
                        htmlFor={`project-${key}`}
                        className="mb-2 block text-sm font-medium"
                      >
                        {key} — mỗi dòng một mục
                      </label>
                      <textarea
                        id={`project-${key}`}
                        className="border-line bg-surface w-full rounded-lg border p-3"
                        rows={4}
                        value={listValue(key)}
                        onChange={(event) =>
                          updateList(key, event.target.value)
                        }
                      />
                    </div>
                  ),
                )}
              </div>
            </details>
            <Notice message={error} error />
            <Notice message={notice} />
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={busy}>
                {editing.published_at
                  ? "Lưu thay đổi công khai"
                  : "Lưu bản nháp"}
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
                            `/projects/${editing.id}/${editing.published_at ? "unpublish" : "publish"}`,
                            { method: "POST" },
                          ),
                        editing.published_at
                          ? "Đã chuyển về bản nháp."
                          : "Đã xuất bản.",
                      )
                    }
                  >
                    {editing.published_at ? "Hủy xuất bản" : "Xuất bản"}
                  </Button>
                  <ConfirmButton
                    label="Xóa"
                    confirmText="Xóa dự án này?"
                    disabled={busy}
                    onConfirm={remove}
                  />
                </>
              )}
            </div>
          </form>
          {editing.id > 0 && (
            <section className="border-line mt-9 border-t pt-7">
              <h3 className="text-lg font-semibold">Hình ảnh</h3>
              <p className="text-muted mt-1 text-sm">
                JPEG, PNG hoặc WebP; tối đa 5 MB; lưu trong S3 đã cấu hình.
              </p>
              <ul className="mt-4 space-y-3">
                {editing.images.map((image) => (
                  <li
                    key={image.id}
                    className="border-line flex flex-wrap items-center gap-3 rounded-lg border p-3"
                  >
                    <a
                      href={image.src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent break-all underline"
                    >
                      {image.alt}
                    </a>
                    <span className="text-muted text-xs">
                      Thứ tự {image.position}
                    </span>
                    <Button
                      type="button"
                      variant="quiet"
                      disabled={busy}
                      onClick={() => void moveImage(image.id, -1)}
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="quiet"
                      disabled={busy}
                      onClick={() => void moveImage(image.id, 1)}
                    >
                      ↓
                    </Button>
                    <ConfirmButton
                      label="Xóa ảnh"
                      confirmText="Xóa ảnh này?"
                      disabled={busy}
                      onConfirm={() =>
                        act(
                          () =>
                            adminRequest(
                              `/projects/${editing.id}/images/${image.id}`,
                              { method: "DELETE" },
                            ),
                          "Đã xóa ảnh.",
                        )
                      }
                    />
                  </li>
                ))}
              </ul>
              <form
                className="mt-5 space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  const data = new FormData(event.currentTarget);
                  void act(
                    () =>
                      adminRequest(`/projects/${editing.id}/images`, {
                        method: "POST",
                        body: data,
                      }),
                    "Đã tải ảnh lên.",
                  );
                }}
              >
                <label
                  htmlFor="project-image"
                  className="block text-sm font-medium"
                >
                  Tệp ảnh
                </label>
                <Input
                  id="project-image"
                  type="file"
                  name="file"
                  accept="image/jpeg,image/png,image/webp"
                  required
                />
                <label
                  htmlFor="project-image-alt"
                  className="block text-sm font-medium"
                >
                  Mô tả ảnh
                </label>
                <Input
                  id="project-image-alt"
                  name="alt"
                  required
                  minLength={3}
                  maxLength={300}
                />
                <Button type="submit" disabled={busy}>
                  Tải ảnh lên
                </Button>
              </form>
            </section>
          )}
        </section>
      </div>
    </>
  );
}
