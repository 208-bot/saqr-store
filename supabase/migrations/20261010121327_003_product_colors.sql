/*
# Product Color Variants

1. New Columns
- products: colors (jsonb array of color variant objects, each with name, hex, and image index)
  - Structure: [{"name": "Black", "hex": "#000000", "image_index": 0}, ...]
  - When a customer selects a color on the storefront, the gallery switches to the linked image.
  - If colors array is empty/null, no color selector is shown (backward compatible).

2. Notes
- Backward compatible: existing products get an empty array default.
- Colors are optional per product.
- Each color variant links to an index in the existing images array.
*/

ALTER TABLE products ADD COLUMN IF NOT EXISTS colors jsonb NOT NULL DEFAULT '[]'::jsonb;
