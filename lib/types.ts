export type Gallery = {
  id: string;
  slug: string;
  title: string;
  cover_photo_id: string | null;
  pin_hash: string | null;
  expires_at: string | null;
  download_enabled: boolean;
  photographer_id: string;
  created_at: string;
};

export type Photo = {
  id: string;
  gallery_id: string;
  r2_key_original: string;
  r2_key_web: string;
  r2_key_thumb: string;
  width: number;
  height: number;
  sort_order: number;
  created_at: string;
};

export type PublicGallery = {
  slug: string;
  title: string;
  studio_name: string;
  created_at: string;
  download_enabled: boolean;
  requires_pin: boolean;
  cover: { web: string; width: number; height: number } | null;
};

export type PublicPhoto = {
  id: string;
  web: string;
  thumb: string;
  width: number;
  height: number;
};
