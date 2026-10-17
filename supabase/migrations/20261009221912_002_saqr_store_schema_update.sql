/*
# SAQR Store Schema Update

1. New Columns
- products: features (jsonb array), purchase_cost (integer for profit calculation)
- store_settings: free_shipping (boolean toggle), owner_name (text)
- orders: status now includes 'مرتجع' (returned)

2. New Tables
- abandoned_carts: Track partially filled checkout forms (ghost carts)
- product_views: Track product view events for analytics

3. Notes
- All new tables single-tenant (anon+authenticated CRUD)
- abandoned_carts captures name, phone, wilaya, product_id, step_reached, exit_reason
- product_views tracks product_id, duration_seconds, wilaya of visitor
*/

-- Add features and purchase_cost to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS purchase_cost integer NOT NULL DEFAULT 0;

-- Add free_shipping and owner_name to store_settings
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS free_shipping boolean NOT NULL DEFAULT false;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS owner_name text NOT NULL DEFAULT 'يوسف';

-- Create abandoned_carts table
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid,
  product_name text NOT NULL DEFAULT '',
  customer_name text DEFAULT '',
  phone text DEFAULT '',
  wilaya_code text DEFAULT '',
  wilaya_name text DEFAULT '',
  selected_size text DEFAULT '',
  quantity integer DEFAULT 1,
  step_reached text DEFAULT 'browsing',
  exit_reason text DEFAULT '',
  shipping_cost integer DEFAULT 0,
  total integer DEFAULT 0,
  recovered boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_carts" ON abandoned_carts;
CREATE POLICY "anon_select_carts" ON abandoned_carts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_carts" ON abandoned_carts;
CREATE POLICY "anon_insert_carts" ON abandoned_carts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_carts" ON abandoned_carts;
CREATE POLICY "anon_update_carts" ON abandoned_carts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_carts" ON abandoned_carts;
CREATE POLICY "anon_delete_carts" ON abandoned_carts FOR DELETE
  TO anon, authenticated USING (true);

-- Create product_views table
CREATE TABLE IF NOT EXISTS product_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid,
  product_name text NOT NULL DEFAULT '',
  duration_seconds integer DEFAULT 0,
  wilaya_code text DEFAULT '',
  wilaya_name text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_views" ON product_views;
CREATE POLICY "anon_select_views" ON product_views FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_views" ON product_views;
CREATE POLICY "anon_insert_views" ON product_views FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_views" ON product_views;
CREATE POLICY "anon_delete_views" ON product_views FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_carts_created ON abandoned_carts(created_at);
CREATE INDEX IF NOT EXISTS idx_views_product ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_views_created ON product_views(created_at);
