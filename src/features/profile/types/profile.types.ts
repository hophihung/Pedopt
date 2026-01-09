export interface Profile {
  id: string;
  role: 'user' | 'seller';
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  subscription_id?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  search_radius_km?: number | null;
  // Additional profile fields
  phone?: string | null;
  location?: string | null;
  bio?: string | null;
  date_of_birth?: string | null;
  reputation_points?: number | null;
  // Shipping address fields
  shipping_name?: string | null;
  shipping_phone?: string | null;
  shipping_address?: string | null;
  shipping_ward?: string | null;
  shipping_district?: string | null;
  shipping_city?: string | null;
  shipping_postal_code?: string | null;
  is_default_shipping?: boolean | null;
}

export interface UpdateProfileInput {
  full_name?: string;
  avatar_url?: string;
  search_radius_km?: number;
  // Additional profile fields
  phone?: string;
  location?: string;
  bio?: string;
  date_of_birth?: string;
  // Shipping address fields
  shipping_name?: string;
  shipping_phone?: string;
  shipping_address?: string;
  shipping_ward?: string;
  shipping_district?: string;
  shipping_city?: string;
  shipping_postal_code?: string;
  is_default_shipping?: boolean;
}

export interface ProfileStats {
  matches: number;
  posts: number;
  favorites: number;
}

