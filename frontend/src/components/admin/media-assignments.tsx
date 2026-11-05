"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/primitives";
import { MediaPicker, MediaUploader } from "@/components/admin/media-library";
import { Notice } from "@/components/admin/admin-ui";
import { adminRequest } from "@/lib/admin-client";
import { mediaSlots, type GlobalMediaSlot } from "@/config/media-slots";
import type { MediaAsset } from "@/types/media";

type Assignment = {
  slot: string;
  project_id: number | null;
  position: number;
  asset: Pick<MediaAsset, "id" | "url" | "alt">;
};

export function MediaAssignments({
  projectId,
  onChanged,
}: {
  projectId?: number;
  onChanged?: () => void;
}) {
  const [items, setItems] = useState<Assignment[]>([]);
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const all = await adminRequest<Assignment[]>("/media/assignments");
    setItems(all.filter((item) => item.project_id === (projectId ?? null)));
  }
  useEffect(() => {
    let active = true;
    adminRequest<Assignment[]>("/media/assignments")
      .then((all) => {
        if (active)
          setItems(
            all.filter((item) => item.project_id === (projectId ?? null)),
          );
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Không thể tải ảnh đã gán.",
          );
      });
    return () => {
      active = false;
    };
  }, [projectId]);

  async function apply(task: () => Promise<unknown>, success: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await task();
      await refresh();
      onChanged?.();
      setNotice(success);
      setActiveSlot(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể lưu ảnh.");
    } finally {
      setBusy(false);
    }
  }

  function galleryIds() {
    return items
      .filter((item) => item.slot === "project_gallery")
      .sort((a, b) => a.position - b.position)
      .map((item) => item.asset.id);
  }

  async function choose(asset: MediaAsset) {
    if (!activeSlot) return;
    const slot = activeSlot;
    if (slot === "project_gallery") {
      const ids = galleryIds();
      if (!ids.includes(asset.id)) ids.push(asset.id);
      await apply(
        () =>
          adminRequest(`/media/projects/${projectId}/gallery`, {
            method: "PUT",
            body: JSON.stringify({ asset_ids: ids }),
          }),
        "Đã cập nhật bộ ảnh.",
      );
    } else {
      await apply(
        () =>
          adminRequest(`/media/assignments/${slot}`, {
            method: "PUT",
            body: JSON.stringify({
              asset_id: asset.id,
              project_id: projectId ?? null,
            }),
          }),
        "Đã gán ảnh.",
      );
    }
  }

  async function remove(slot: string, id?: string) {
    if (slot === "project_gallery") {
      await apply(
        () =>
          adminRequest(`/media/projects/${projectId}/gallery`, {
            method: "PUT",
            body: JSON.stringify({
              asset_ids: galleryIds().filter((value) => value !== id),
            }),
          }),
        "Đã bỏ ảnh khỏi bộ ảnh.",
      );
    } else {
      const suffix = projectId ? `?project_id=${projectId}` : "";
      await apply(
        () =>
          adminRequest(`/media/assignments/${slot}${suffix}`, {
            method: "DELETE",
          }),
        "Đã bỏ gán ảnh.",
      );
    }
  }

  async function move(id: string, direction: -1 | 1) {
    const ids = galleryIds();
    const from = ids.indexOf(id);
    const to = from + direction;
    if (to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    await apply(
      () =>
        adminRequest(`/media/projects/${projectId}/gallery`, {
          method: "PUT",
          body: JSON.stringify({ asset_ids: ids }),
        }),
      "Đã đổi thứ tự ảnh.",
    );
  }

  const slots = projectId
    ? (["project_thumbnail", "project_gallery"] as const)
    : (Object.keys(mediaSlots).filter(
        (slot) => !slot.startsWith("project_"),
      ) as GlobalMediaSlot[]);
  return (
    <section
      className="border-line space-y-5 border-t pt-7"
      aria-label={projectId ? "Ảnh dự án" : "Vị trí ảnh toàn trang"}
    >
      <h2 className="text-lg font-semibold">
        {projectId ? "Ảnh dự án" : "Ảnh trên các trang"}
      </h2>
      <Notice message={notice} />
      <Notice message={error} error />
      {slots.map((slot) => {
        const assigned = items
          .filter((item) => item.slot === slot)
          .sort((a, b) => a.position - b.position);
        return (
          <div key={slot} className="border-line rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-medium">{mediaSlots[slot]}</h3>
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => setActiveSlot(activeSlot === slot ? null : slot)}
              >
                Chọn ảnh
              </Button>
            </div>
            {assigned.length ? (
              <ol className="mt-3 space-y-2">
                {assigned.map((entry) => (
                  <li
                    key={entry.asset.id}
                    className="text-muted flex flex-wrap items-center gap-2 text-sm"
                  >
                    <span>{entry.asset.alt}</span>
                    {slot === "project_gallery" && (
                      <>
                        <Button
                          type="button"
                          variant="quiet"
                          disabled={busy}
                          onClick={() => void move(entry.asset.id, -1)}
                          aria-label={`Đưa ${entry.asset.alt} lên`}
                        >
                          ↑
                        </Button>
                        <Button
                          type="button"
                          variant="quiet"
                          disabled={busy}
                          onClick={() => void move(entry.asset.id, 1)}
                          aria-label={`Đưa ${entry.asset.alt} xuống`}
                        >
                          ↓
                        </Button>
                      </>
                    )}
                    <Button
                      type="button"
                      variant="quiet"
                      disabled={busy}
                      onClick={() => void remove(slot, entry.asset.id)}
                    >
                      Bỏ gán
                    </Button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-muted mt-3 text-sm">Chưa chọn ảnh.</p>
            )}
            {activeSlot === slot && (
              <div className="mt-5 space-y-5">
                <MediaPicker
                  onPick={(asset) => void choose(asset)}
                  selectedId={assigned[0]?.asset.id}
                />
                <MediaUploader onUploaded={(asset) => void choose(asset)} />
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
