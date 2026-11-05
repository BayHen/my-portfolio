export type MediaUsage = {
  slot: string;
  project_id: number | null;
  position: number;
};

export type MediaAsset = {
  id: string;
  url: string;
  alt: string;
  content_type: string;
  byte_size: number;
  width: number;
  height: number;
  created_at: string;
  usage: MediaUsage[];
};

export type MediaPage = {
  items: MediaAsset[];
  total: number;
  limit: number;
  offset: number;
};

export type PublicMediaAssignment = {
  slot: string;
  project_id: number | null;
  project_slug: string | null;
  position: number;
  asset: Pick<MediaAsset, "id" | "url" | "alt">;
};
