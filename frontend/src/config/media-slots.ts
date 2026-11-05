export const mediaSlots = {
  hero_avatar: "Ảnh đại diện trang chủ",
  hero_background: "Ảnh nền trang chủ",
  about_profile: "Ảnh trang giới thiệu",
  open_graph: "Ảnh chia sẻ mạng xã hội",
  project_thumbnail: "Ảnh bìa dự án",
  project_gallery: "Bộ ảnh dự án",
} as const;

export type MediaSlot = keyof typeof mediaSlots;
export type GlobalMediaSlot = Exclude<
  MediaSlot,
  "project_thumbnail" | "project_gallery"
>;
