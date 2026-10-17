export interface ColorVariant {
  name: string;
  hex: string;
  image_index: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: 'hoodies' | 'joggers' | 'beanies';
  price: number;
  sale_price: number | null;
  stock: number;
  sizes: string[];
  images: string[];
  features: string[];
  purchase_cost: number;
  colors: ColorVariant[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  phone_1: string;
  phone_2: string;
  wilaya_code: string;
  wilaya_name: string;
  commune: string;
  shipping_type: 'home' | 'desk';
  product_id: string | null;
  product_name: string;
  product_size: string;
  quantity: number;
  unit_price: number;
  shipping_cost: number;
  total: number;
  status: OrderStatus;
  notes: string;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 'جديد' | 'مؤكد' | 'قيد التوصيل' | 'مكتمل' | 'مرتجع';

export interface ShippingRate {
  id: string;
  wilaya_code: string;
  wilaya_name: string;
  home_delivery_cost: number;
  stop_desk_cost: number;
}

export interface StoreSettings {
  id: number;
  store_name: string;
  hero_title: string;
  hero_subtitle: string;
  accent_color: string;
  secondary_color: string;
  currency: string;
  admin_pin: string;
  webhook_url: string;
  sender_name: string;
  sender_phone: string;
  sender_address: string;
  free_shipping: boolean;
  owner_name: string;
}

export interface AbandonedCart {
  id: string;
  product_id: string | null;
  product_name: string;
  customer_name: string;
  phone: string;
  wilaya_code: string;
  wilaya_name: string;
  selected_size: string;
  quantity: number;
  step_reached: string;
  exit_reason: string;
  shipping_cost: number;
  total: number;
  recovered: boolean;
  created_at: string;
}

export interface ProductView {
  id: string;
  product_id: string | null;
  product_name: string;
  duration_seconds: number;
  wilaya_code: string;
  wilaya_name: string;
  created_at: string;
}

export const ORDER_STATUSES: OrderStatus[] = ['جديد', 'مؤكد', 'قيد التوصيل', 'مكتمل', 'مرتجع'];

export const ORDER_TABS = ['الكل', 'جديد', 'مؤكد', 'قيد التوصيل', 'مكتمل', 'مرتجع'] as const;
export type OrderTab = typeof ORDER_TABS[number];

export const CATEGORY_LABELS_AR: Record<string, string> = {
  hoodies: 'أقمصة صوفية',
  joggers: 'سراويل',
  beanies: 'قبعات و طاقيات',
};

export const CATEGORY_LABELS_EN: Record<string, string> = {
  hoodies: 'Hoodies',
  joggers: 'Joggers',
  beanies: 'Beanies & Caps',
};

export const CATEGORY_LABELS_FR: Record<string, string> = {
  hoodies: 'Sweats',
  joggers: 'Joggers',
  beanies: 'Bonnet & Casquettes',
};

export const CATEGORY_LABELS: Record<string, string> = CATEGORY_LABELS_EN;
