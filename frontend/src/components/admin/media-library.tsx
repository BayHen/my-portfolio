"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, type DragEvent } from "react";
import { Button, Input } from "@/components/ui/primitives";
import { adminRequest } from "@/lib/admin-client";
import type { MediaAsset, MediaPage } from "@/types/media";
import {
  AdminHeading,
  AdminLoading,
  ConfirmButton,
  Notice,
} from "@/components/admin/admin-ui";

const MAX_BYTES = 5 * 1024 * 1024;
const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function fetchMediaPage(search: string, offset: number, limit: number) {
  const query = new URLSearchParams({
    search,
    offset: String(offset),
    limit: String(limit),
  });
  return adminRequest<MediaPage>(`/media?${query}`);
}

export function MediaPreview({ asset }: { asset: MediaAsset }) {
  return (
    <div className="border-line bg-subtle relative aspect-video overflow-hidden rounded-lg border">
      <Image
        src={`/api/admin/media/${asset.id}/file`}
        alt={asset.alt}
        fill
        unoptimized
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-contain"
      />
    </div>
  );
}

export function MediaGrid({
  items,
  selectedId,
  onSelect,
}: {
  items: MediaAsset[];
  selectedId?: string;
  onSelect: (asset: MediaAsset) => void;
}) {
  if (!items.length)
    return <p className="text-muted py-10">Chưa có ảnh phù hợp.</p>;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {items.map((asset) => (
        <button
          key={asset.id}
          type="button"
          aria-pressed={asset.id === selectedId}
          onClick={() => onSelect(asset)}
          className="border-line bg-surface hover:border-accent aria-pressed:border-accent rounded-lg border p-2 text-left"
        >
          <MediaPreview asset={asset} />
          <span className="mt-2 block truncate text-sm font-medium">
            {asset.alt}
          </span>
          <span className="text-muted block text-xs">
            {asset.width} × {asset.height}
          </span>
        </button>
      ))}
    </div>
  );
}

export function MediaUploader({
  onUploaded,
}: {
  onUploaded: (asset: MediaAsset) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function acceptFile(candidate: File | undefined) {
    if (!candidate) return;
    if (!acceptedTypes.has(candidate.type) || candidate.size > MAX_BYTES) {
      setError("Chọn ảnh JPEG, PNG hoặc WebP không quá 5 MB.");
      return;
    }
    setFile(candidate);
    setError("");
  }

  function drop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    acceptFile(event.dataTransfer.files[0]);
  }

  async function upload() {
    if (!file || alt.trim().length < 3) {
      setError("Chọn ảnh và nhập mô tả thay thế từ 3 ký tự.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("alt", alt.trim());
      const asset = await adminRequest<MediaAsset>("/media", {
        method: "POST",
        body,
      });
      setFile(null);
      setAlt("");
      onUploaded(asset);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không thể tải ảnh lên.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-line bg-surface space-y-4 rounded-xl border p-5">
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={drop}
        className="border-line bg-subtle rounded-lg border border-dashed p-5"
      >
        <label htmlFor="media-file" className="block text-sm font-medium">
          Kéo ảnh vào đây hoặc chọn tệp
        </label>
        <Input
          id="media-file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="mt-3"
          onChange={(event) => acceptFile(event.target.files?.[0])}
        />
        {file && (
          <p className="text-muted mt-2 text-sm">Đã chọn: {file.name}</p>
        )}
      </div>
      <label htmlFor="media-alt" className="block text-sm font-medium">
        Mô tả ảnh (alt text)
      </label>
      <Input
        id="media-alt"
        value={alt}
        onChange={(event) => setAlt(event.target.value)}
        maxLength={300}
      />
      <Button type="button" disabled={busy} onClick={() => void upload()}>
        {busy ? "Đang tải lên…" : "Tải ảnh lên"}
      </Button>
      <Notice message={error} error />
    </div>
  );
}

export function MediaPicker({
  onPick,
  selectedId,
}: {
  onPick: (asset: MediaAsset) => void;
  selectedId?: string;
}) {
  const [page, setPage] = useState<MediaPage | null>(null);
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetchMediaPage(search, offset, 12)
      .then((result) => {
        if (active) setPage(result);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Không thể tải thư viện ảnh.",
          );
      });
    return () => {
      active = false;
    };
  }, [search, offset]);
  return (
    <div className="space-y-4">
      <Input
        aria-label="Tìm ảnh theo mô tả"
        placeholder="Tìm ảnh theo mô tả"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setOffset(0);
        }}
      />
      <Notice message={error} error />
      {page ? (
        <MediaGrid
          items={page.items}
          selectedId={selectedId}
          onSelect={onPick}
        />
      ) : (
        <AdminLoading />
      )}
      {page && page.total > 12 && (
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            type="button"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - 12))}
          >
            Trước
          </Button>
          <span className="text-muted text-sm">
            {offset + 1}–{Math.min(offset + 12, page.total)} / {page.total}
          </span>
          <Button
            variant="secondary"
            type="button"
            disabled={offset + 12 >= page.total}
            onClick={() => setOffset(offset + 12)}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
}

export function MediaDetails({
  asset,
  onChanged,
  onDeleted,
}: {
  asset: MediaAsset;
  onChanged: (asset: MediaAsset) => void;
  onDeleted: () => void;
}) {
  const [alt, setAlt] = useState(asset.alt);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function action(task: () => Promise<MediaAsset>) {
    setBusy(true);
    setError("");
    try {
      onChanged(await task());
      setFile(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Thao tác thất bại.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="border-line bg-surface space-y-4 rounded-xl border p-5">
      <MediaPreview asset={asset} />
      <p className="text-muted text-sm">
        {asset.width} × {asset.height} · {(asset.byte_size / 1024).toFixed(0)}{" "}
        KB
      </p>
      <label htmlFor="media-detail-alt" className="block text-sm font-medium">
        Mô tả ảnh
      </label>
      <Input
        id="media-detail-alt"
        value={alt}
        maxLength={300}
        onChange={(event) => setAlt(event.target.value)}
      />
      <Button
        variant="secondary"
        type="button"
        disabled={busy || alt.trim().length < 3}
        onClick={() =>
          void action(() =>
            adminRequest(`/media/${asset.id}`, {
              method: "PATCH",
              body: JSON.stringify({ alt: alt.trim() }),
            }),
          )
        }
      >
        Lưu mô tả
      </Button>
      <label htmlFor="media-replace" className="block text-sm font-medium">
        Thay tệp ảnh
      </label>
      <Input
        id="media-replace"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => setFile(event.target.files?.[0] || null)}
      />
      <Button
        variant="secondary"
        type="button"
        disabled={busy || !file}
        onClick={() =>
          void action(() => {
            const body = new FormData();
            body.set("file", file!);
            return adminRequest(`/media/${asset.id}/file`, {
              method: "PUT",
              body,
            });
          })
        }
      >
        Thay ảnh
      </Button>
      <div>
        <h3 className="text-sm font-semibold">Đang được dùng tại</h3>
        {asset.usage.length ? (
          <ul className="text-muted mt-2 list-inside list-disc text-sm">
            {asset.usage.map((usage, index) => (
              <li key={`${usage.slot}-${usage.project_id}-${index}`}>
                {usage.slot}
                {usage.project_id ? ` · dự án #${usage.project_id}` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted mt-2 text-sm">Chưa được dùng.</p>
        )}
      </div>
      <ConfirmButton
        label="Xóa ảnh"
        confirmText="Xóa vĩnh viễn ảnh chưa dùng?"
        disabled={busy || asset.usage.length > 0}
        onConfirm={async () => {
          try {
            await adminRequest(`/media/${asset.id}`, { method: "DELETE" });
            onDeleted();
          } catch (cause) {
            setError(
              cause instanceof Error ? cause.message : "Không thể xóa ảnh.",
            );
          }
        }}
      />
      <Notice message={error} error />
    </div>
  );
}

export function MediaLibrary({ revision = 0 }: { revision?: number }) {
  const [page, setPage] = useState<MediaPage | null>(null);
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const selectedId = selected?.id;
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    try {
      setPage(await fetchMediaPage(search, offset, 24));
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải ảnh.");
    }
  }, [search, offset]);
  useEffect(() => {
    let active = true;
    fetchMediaPage(search, offset, 24)
      .then((result) => {
        if (active) setPage(result);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Không thể tải ảnh.",
          );
      });
    return () => {
      active = false;
    };
  }, [search, offset, revision]);
  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    adminRequest<MediaAsset>(`/media/${selectedId}`)
      .then((asset) => {
        if (active) setSelected(asset);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [revision, selectedId]);
  return (
    <>
      <AdminHeading
        title="Thư viện ảnh"
        description="Tải lên một lần và dùng ảnh ở nhiều vị trí trong portfolio."
      />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <MediaUploader
            onUploaded={(asset) => {
              setSelected(asset);
              setNotice("Đã lưu ảnh.");
              void load();
            }}
          />
          <Input
            aria-label="Tìm ảnh"
            placeholder="Tìm theo mô tả"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setOffset(0);
            }}
          />
          <Notice message={notice} />
          <Notice message={error} error />
          {page ? (
            <MediaGrid
              items={page.items}
              selectedId={selected?.id}
              onSelect={setSelected}
            />
          ) : (
            <AdminLoading />
          )}
          {page && page.total > 24 && (
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - 24))}
              >
                Trước
              </Button>
              <span className="text-muted text-sm">
                {offset + 1}–{Math.min(offset + 24, page.total)} / {page.total}
              </span>
              <Button
                variant="secondary"
                disabled={offset + 24 >= page.total}
                onClick={() => setOffset(offset + 24)}
              >
                Sau
              </Button>
            </div>
          )}
        </div>
        {selected && (
          <MediaDetails
            key={selected.id}
            asset={selected}
            onChanged={(asset) => {
              setSelected(asset);
              setNotice("Đã lưu thay đổi.");
              void load();
            }}
            onDeleted={() => {
              setSelected(null);
              setNotice("Đã xóa ảnh.");
              void load();
            }}
          />
        )}
      </div>
    </>
  );
}
