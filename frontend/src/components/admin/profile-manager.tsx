"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  AdminHeading,
  AdminLoading,
  Field,
  Notice,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/primitives";
import { adminRequest } from "@/lib/admin-client";

type SocialLink = { label: string; url: string };
type Profile = {
  name: string;
  headline: string;
  introduction: string | null;
  bio: string;
  location: string | null;
  interests: string[];
  skills: string[];
  education: object[];
  social_links: SocialLink[];
  resume_url: string | null;
  public_email: string | null;
  published_at: string | null;
};
const blank: Profile = {
  name: "",
  headline: "",
  introduction: "",
  bio: "",
  location: "",
  interests: [],
  skills: [],
  education: [],
  social_links: [],
  resume_url: "",
  public_email: "",
  published_at: null,
};

export function ProfileManager() {
  const [profile, setProfile] = useState<Profile>(blank);
  const [linksText, setLinksText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    try {
      const result = await adminRequest<Profile | null>("/profile");
      if (result) {
        setProfile(result);
        setLinksText(
          (result.social_links || [])
            .map((link) => `${link.label} | ${link.url}`)
            .join("\n"),
        );
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải hồ sơ.");
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
  function update(key: keyof Profile, value: string) {
    setProfile((current) => ({ ...current, [key]: value }));
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
    const social_links = linksText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const split = line.indexOf("|");
        if (split < 1)
          throw new Error("Liên kết xã hội cần dạng Tên | https://...");
        return {
          label: line.slice(0, split).trim(),
          url: line.slice(split + 1).trim(),
        };
      });
    await act(
      () =>
        adminRequest("/profile", {
          method: "PUT",
          body: JSON.stringify({
            ...profile,
            social_links,
            resume_url: profile.resume_url || null,
            public_email: profile.public_email || null,
          }),
        }),
      "Đã lưu hồ sơ.",
    );
  }
  if (loading) return <AdminLoading />;
  return (
    <>
      <AdminHeading
        title="Hồ sơ & thiết lập"
        description="Chỉ điền thông tin đã được xác minh. Nội dung là văn bản thuần; liên kết phải dùng HTTPS."
      />
      <form
        onSubmit={(event) => {
          void save(event).catch((cause) =>
            setError(
              cause instanceof Error ? cause.message : "Dữ liệu không hợp lệ.",
            ),
          );
        }}
        className="border-line bg-surface max-w-3xl space-y-5 rounded-xl border p-5 sm:p-8"
      >
        <Field
          name="profile-name"
          label="Tên công khai"
          value={profile.name}
          onChange={(value) => update("name", value)}
          required
        />
        <Field
          name="profile-headline"
          label="Tiêu đề chuyên môn"
          value={profile.headline}
          onChange={(value) => update("headline", value)}
          required
        />
        <Field
          name="profile-introduction"
          label="Giới thiệu ngắn"
          value={profile.introduction || ""}
          onChange={(value) => update("introduction", value)}
          multiline
        />
        <Field
          name="profile-bio"
          label="Tiểu sử"
          value={profile.bio}
          onChange={(value) => update("bio", value)}
          multiline
          required
        />
        <Field
          name="profile-location"
          label="Địa điểm"
          value={profile.location || ""}
          onChange={(value) => update("location", value)}
        />
        <div>
          <label
            htmlFor="profile-interests"
            className="mb-2 block text-sm font-medium"
          >
            Mối quan tâm — mỗi dòng một mục
          </label>
          <textarea
            id="profile-interests"
            className="border-line bg-surface w-full rounded-lg border p-3"
            rows={4}
            value={(profile.interests || []).join("\n")}
            onChange={(event) =>
              setProfile({
                ...profile,
                interests: event.target.value
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>
        <div>
          <label
            htmlFor="profile-skills"
            className="mb-2 block text-sm font-medium"
          >
            Kỹ năng — mỗi dòng một mục
          </label>
          <textarea
            id="profile-skills"
            className="border-line bg-surface w-full rounded-lg border p-3"
            rows={4}
            value={(profile.skills || []).join("\n")}
            onChange={(event) =>
              setProfile({
                ...profile,
                skills: event.target.value
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>
        <div>
          <label
            htmlFor="profile-social"
            className="mb-2 block text-sm font-medium"
          >
            Liên kết xã hội — Tên | https://…
          </label>
          <textarea
            id="profile-social"
            className="border-line bg-surface w-full rounded-lg border p-3"
            rows={4}
            value={linksText}
            onChange={(event) => setLinksText(event.target.value)}
          />
        </div>
        <Field
          name="profile-email"
          label="Email công khai"
          value={profile.public_email || ""}
          onChange={(value) => update("public_email", value)}
          type="email"
        />
        <Field
          name="profile-resume"
          label="URL hồ sơ PDF"
          value={profile.resume_url || ""}
          onChange={(value) => update("resume_url", value)}
          type="url"
        />
        <Notice message={error} error />
        <Notice message={notice} />
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={busy}>
            Lưu hồ sơ
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() =>
              act(
                () =>
                  adminRequest(
                    `/profile/${profile.published_at ? "unpublish" : "publish"}`,
                    { method: "POST" },
                  ),
                "Đã cập nhật trạng thái công khai.",
              )
            }
          >
            {profile.published_at ? "Hủy xuất bản" : "Xuất bản"}
          </Button>
        </div>
        <p className="text-muted text-xs">
          {profile.published_at
            ? "Hồ sơ đang công khai. Nội dung lưu mới sẽ hiện sau khi cache hết hạn."
            : "Hồ sơ đang là bản nháp."}
        </p>
      </form>
    </>
  );
}
