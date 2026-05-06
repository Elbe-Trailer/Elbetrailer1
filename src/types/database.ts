export type ListingType = "kauf" | "miete" | "kauf_und_miete";

export type Category = {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export type AccessoryCategory = {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  /** false = Endkunden wählen im Konfigurator nur eine Option; Admin kann mehrere Artikel zuweisen. */
  allows_multiple: boolean;
};

export type Accessory = {
  id: string;
  name: string;
  article_number: string | null;
  brand: string | null;
  description: string | null;
  category_id: string | null;
  price_adjustment_cents: number;
  image_path: string | null;
  active: boolean;
};

/** Admin: Inserat-Zubehör mit Kategorieregeln (Join). */
export type AccessoryForListingConfig = Pick<
  Accessory,
  "id" | "name" | "category_id" | "article_number" | "brand"
> & {
  accessory_categories: {
    id: string;
    name: string;
    sort_order: number;
    allows_multiple: boolean;
  } | null;
};

export type Listing = {
  id: string;
  title: string;
  article_number: string | null;
  brand: string | null;
  description: string | null;
  price_cents: number | null;
  daily_rate_cents: number | null;
  condition: string | null;
  exterior_length_mm: number | null;
  exterior_width_mm: number | null;
  loading_length_mm: number | null;
  loading_width_mm: number | null;
  gross_weight_kg: number | null;
  payload_kg: number | null;
  empty_weight_kg: number | null;
  tire_size_inch: number | null;
  length_mm: number | null;
  width_mm: number | null;
  height_mm: number | null;
  axle_count: number | null;
  braked: boolean | null;
  tip_function: string | null;
  lighting: string | null;
  loading_ramps: string | null;
  loading_area: string | null;
  category_id: string;
  listing_type: ListingType;
  published: boolean;
  gallery_paths: string[];
  created_at: string;
  updated_at: string;
};

export type ListingAccessoryRow = {
  listing_id: string;
  accessory_id: string;
  max_quantity: number;
};

export type BlogCategory = {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
};

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  author: string | null;
  cover_image_path: string | null;
  category_id: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ListingHighlight = {
  listing_id: string;
  position: number;
};

export type AccessorySelection = {
  accessory_id: string;
  quantity: number;
};

export type InquiryInsert = {
  listing_id: string;
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  accessory_selections: AccessorySelection[];
  rental_unit_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
};

export type RentalBookingStatus = "pending" | "confirmed" | "cancelled";

export type RentalUnit = {
  id: string;
  listing_id: string;
  active: boolean;
  min_rental_days: number;
  created_at: string;
  updated_at: string;
};

export type RentalCalendarBlock = {
  id: string;
  rental_unit_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  created_at: string;
};

export type RentalBooking = {
  id: string;
  rental_unit_id: string;
  inquiry_id: string | null;
  status: RentalBookingStatus;
  start_date: string;
  end_date: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_message: string | null;
  created_at: string;
  updated_at: string;
};
