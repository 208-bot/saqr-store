/*
# Streetwear COD Store - Initial Schema

1. New Tables
- `products`: Product catalog (hoodies, joggers, beanies/caps) with pricing, stock, sizes, images, active flag.
- `orders`: Customer COD orders with full Algerian shipping fields (wilaya, commune, shipping type) and status tracking.
- `shipping_rates`: Per-wilaya delivery costs for home delivery vs stop desk.
- `store_settings`: Singleton row for store configuration (name, hero text, accent color, admin PIN, webhook URL).

2. Security
- Single-tenant app (no Supabase auth — admin uses PIN gate in localStorage).
- RLS enabled on all tables, policies scoped to `anon, authenticated` for full CRUD.
- All data is intentionally public/shared for this storefront model.

3. Notes
- Products use a JSONB `sizes` array (e.g. ["S","M","L","XL","XXL"]) and `images` array.
- Orders store denormalized product snapshot (name, price at time of order) for historical accuracy.
- Order status is an enum: 'جديد' (new), 'مؤكد' (confirmed), 'قيد التوصيل' (in delivery), 'مكتمل' (completed).
- Store settings is enforced singleton via a CHECK constraint on id = 1.
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL DEFAULT 'hoodies',
  price integer NOT NULL DEFAULT 0,
  sale_price integer DEFAULT NULL,
  stock integer NOT NULL DEFAULT 0,
  sizes jsonb NOT NULL DEFAULT '["S","M","L","XL","XXL"]'::jsonb,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_products" ON products;
CREATE POLICY "anon_insert_products" ON products FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "anon_delete_products" ON products FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  customer_name text NOT NULL,
  phone_1 text NOT NULL,
  phone_2 text DEFAULT '',
  wilaya_code text NOT NULL,
  wilaya_name text NOT NULL,
  commune text NOT NULL,
  shipping_type text NOT NULL DEFAULT 'home',
  product_id uuid,
  product_name text NOT NULL,
  product_size text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price integer NOT NULL DEFAULT 0,
  shipping_cost integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'جديد',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_orders" ON orders;
CREATE POLICY "anon_delete_orders" ON orders FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS shipping_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wilaya_code text NOT NULL UNIQUE,
  wilaya_name text NOT NULL,
  home_delivery_cost integer NOT NULL DEFAULT 800,
  stop_desk_cost integer NOT NULL DEFAULT 400,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_shipping" ON shipping_rates;
CREATE POLICY "anon_select_shipping" ON shipping_rates FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_shipping" ON shipping_rates;
CREATE POLICY "anon_insert_shipping" ON shipping_rates FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_shipping" ON shipping_rates;
CREATE POLICY "anon_update_shipping" ON shipping_rates FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_shipping" ON shipping_rates;
CREATE POLICY "anon_delete_shipping" ON shipping_rates FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS store_settings (
  id integer PRIMARY KEY DEFAULT 1,
  store_name text NOT NULL DEFAULT 'STREET DZ',
  hero_title text NOT NULL DEFAULT 'Streetwear That Speaks',
  hero_subtitle text NOT NULL DEFAULT 'Premium hoodies, joggers & caps. Cash on delivery across all 58 wilayas.',
  accent_color text NOT NULL DEFAULT '#0a0a0a',
  secondary_color text NOT NULL DEFAULT '#f5f5f5',
  currency text NOT NULL DEFAULT 'DZD',
  admin_pin text NOT NULL DEFAULT '2824',
  webhook_url text DEFAULT '',
  sender_name text NOT NULL DEFAULT 'STREET DZ STORE',
  sender_phone text NOT NULL DEFAULT '0550000000',
  sender_address text NOT NULL DEFAULT 'Alger Centre, Alger',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT singleton CHECK (id = 1)
);

ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_settings" ON store_settings;
CREATE POLICY "anon_select_settings" ON store_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_update_settings" ON store_settings;
CREATE POLICY "anon_update_settings" ON store_settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_insert_settings" ON store_settings;
CREATE POLICY "anon_insert_settings" ON store_settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Insert default settings row
INSERT INTO store_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone_1);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_shipping_wilaya_code ON shipping_rates(wilaya_code);
