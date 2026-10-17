import { useState, useMemo, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Search, Package, Upload, Image as ImageIcon, Palette } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { Product, ColorVariant } from '@/lib/types';
import { CATEGORY_LABELS } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', '6XL', 'One Size'];

const PRESET_COLORS: { name: string; hex: string }[] = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Navy', hex: '#1B2A4A' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Dark Gray', hex: '#4A4A4A' },
  { name: 'Red', hex: '#DC2626' },
  { name: 'Maroon', hex: '#800000' },
  { name: 'Green', hex: '#16A34A' },
  { name: 'Olive', hex: '#808000' },
  { name: 'Brown', hex: '#8B4513' },
  { name: 'Beige', hex: '#D2B48C' },
  { name: 'Khaki', hex: '#C3B091' },
  { name: 'Orange', hex: '#EA580C' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'Blue', hex: '#2563EB' },
  { name: 'Sky Blue', hex: '#38BDF8' },
  { name: 'Teal', hex: '#0D9488' },
  { name: 'Purple', hex: '#7C3AED' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Gold', hex: '#D4AF37' },
];

export default function AdminProducts() {
  const { products, saveProduct, deleteProduct } = useStore();
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (filterCat === 'all' || p.category === filterCat) &&
          p.name.toLowerCase().includes(search.toLowerCase())
      ),
    [products, search, filterCat]
  );

  const startNew = () => {
    setEditing({
      name: '',
      description: '',
      category: 'hoodies',
      price: 0,
      sale_price: null,
      stock: 0,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      images: [],
      colors: [],
      is_active: true,
    });
  };

  const handleSave = async () => {
    if (!editing || !editing.name) return;
    const clean: Partial<Product> = {
      ...editing,
      colors: (editing.colors || []).filter((c) => c.name && c.hex),
    };
    await saveProduct(clean);
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this product? This cannot be undone.')) {
      await deleteProduct(id);
    }
  };

  const updateImage = (index: number, url: string) => {
    if (!editing) return;
    const images = [...(editing.images || [])];
    images[index] = url;
    setEditing({ ...editing, images });
  };

  const addImage = () => {
    if (!editing) return;
    setEditing({ ...editing, images: [...(editing.images || []), ''] });
  };

  const removeImage = (index: number) => {
    if (!editing) return;
    const images = [...(editing.images || [])];
    images.splice(index, 1);
    const colors = [...(editing.colors || [])].map((c) =>
      c.image_index > index ? { ...c, image_index: c.image_index - 1 } : c.image_index === index ? { ...c, image_index: 0 } : c
    );
    setEditing({ ...editing, images, colors });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !editing) return;
    const newImages = [...(editing.images || [])];
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          newImages.push(result);
          setEditing((prev) => prev ? { ...prev, images: [...newImages] } : prev);
        }
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleSize = (size: string) => {
    if (!editing) return;
    const sizes = editing.sizes || [];
    setEditing({
      ...editing,
      sizes: sizes.includes(size) ? sizes.filter((s) => s !== size) : [...sizes, size],
    });
  };

  const addColor = (name: string, hex: string) => {
    if (!editing) return;
    const colors = editing.colors || [];
    if (colors.some((c) => c.name.toLowerCase() === name.toLowerCase())) return;
    setEditing({
      ...editing,
      colors: [...colors, { name, hex, image_index: 0 }],
    });
  };

  const removeColor = (index: number) => {
    if (!editing) return;
    const colors = [...(editing.colors || [])];
    colors.splice(index, 1);
    setEditing({ ...editing, colors });
  };

  const updateColorImage = (colorIndex: number, imageIndex: number) => {
    if (!editing) return;
    const colors = [...(editing.colors || [])];
    colors[colorIndex] = { ...colors[colorIndex], image_index: imageIndex };
    setEditing({ ...editing, colors });
  };

  const updateColorHex = (colorIndex: number, hex: string) => {
    if (!editing) return;
    const colors = [...(editing.colors || [])];
    colors[colorIndex] = { ...colors[colorIndex], hex };
    setEditing({ ...editing, colors });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-neutral-500 text-sm mt-1">{products.length} products in catalog</p>
        </div>
        <button
          onClick={startNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 text-white font-semibold text-sm hover:bg-neutral-800 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent bg-white"
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-neutral-200 text-sm bg-white outline-none focus:ring-2 focus:ring-neutral-900"
        >
          <option value="all">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((product) => (
          <div key={product.id} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden group">
            <div className="aspect-[3/2] bg-neutral-100 relative">
              {product.images[0] ? (
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-10 h-10 text-neutral-300" />
                </div>
              )}
              {!product.is_active && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-neutral-900 text-white text-xs font-medium">
                  Hidden
                </div>
              )}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/90 text-xs font-medium">
                {CATEGORY_LABELS[product.category]}
              </div>
              {(product.colors || []).length > 0 && (
                <div className="absolute bottom-2 left-2 flex gap-1 px-2 py-1 rounded-full bg-white/90">
                  {(product.colors || []).slice(0, 5).map((c, i) => (
                    <span key={i} className="w-3 h-3 rounded-full border border-neutral-300" style={{ background: c.hex }} />
                  ))}
                  {(product.colors || []).length > 5 && (
                    <span className="text-xs text-neutral-500">+{(product.colors || []).length - 5}</span>
                  )}
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-medium text-sm leading-snug">{product.name}</h3>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setEditing(product)}
                    className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-neutral-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-sm" style={{ color: 'var(--accent)' }}>
                  {formatPrice(product.sale_price ?? product.price)}
                </span>
                {product.sale_price && (
                  <span className="text-xs text-neutral-400 line-through">{formatPrice(product.price)}</span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Stock: <span className={product.stock <= 10 ? 'text-red-500 font-medium' : ''}>{product.stock}</span></span>
                <span>{product.sizes.join(', ')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit/Create modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-5 py-4 flex items-center justify-between">
              <h3 className="font-semibold">{editing.id ? 'Edit Product' : 'New Product'}</h3>
              <button onClick={() => setEditing(null)} className="p-2 rounded-lg hover:bg-neutral-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Name</label>
                <input
                  type="text"
                  value={editing.name || ''}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="Product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <textarea
                  value={editing.description || ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm outline-none focus:ring-2 focus:ring-neutral-900 resize-none"
                  placeholder="Product description"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Category</label>
                  <select
                    value={editing.category || 'hoodies'}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value as Product['category'] })}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm bg-white outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Stock</label>
                  <input
                    type="number"
                    value={editing.stock ?? 0}
                    onChange={(e) => setEditing({ ...editing, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Price (DA)</label>
                  <input
                    type="number"
                    value={editing.price ?? 0}
                    onChange={(e) => setEditing({ ...editing, price: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Sale Price (optional)</label>
                  <input
                    type="number"
                    value={editing.sale_price ?? ''}
                    onChange={(e) => setEditing({ ...editing, sale_price: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
                    placeholder="—"
                  />
                </div>
              </div>

              {/* Sizes */}
              <div>
                <label className="block text-sm font-medium mb-2">Available Sizes</label>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSize(s)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        (editing.sizes || []).includes(s)
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Palette className="w-4 h-4 text-neutral-400" />
                  Available Colors
                </label>

                {/* Existing colors */}
                {(editing.colors || []).length > 0 && (
                  <div className="space-y-2 mb-3">
                    {(editing.colors || []).map((color, ci) => (
                      <div key={ci} className="flex items-center gap-2 p-2 rounded-xl border border-neutral-200">
                        <div className="w-8 h-8 rounded-lg border border-neutral-300 shrink-0" style={{ background: color.hex }} />
                        <input
                          type="text"
                          value={color.name}
                          onChange={(e) => {
                            const colors = [...(editing.colors || [])];
                            colors[ci] = { ...colors[ci], name: e.target.value };
                            setEditing({ ...editing, colors });
                          }}
                          className="flex-1 px-2 py-1.5 rounded-lg border border-neutral-200 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
                          placeholder="Color name"
                        />
                        <select
                          value={color.image_index}
                          onChange={(e) => updateColorImage(ci, parseInt(e.target.value))}
                          className="px-2 py-1.5 rounded-lg border border-neutral-200 text-xs bg-white outline-none focus:ring-2 focus:ring-neutral-900 max-w-[120px]"
                        >
                          <option value={0}>No image link</option>
                          {(editing.images || []).map((img, ii) => (
                            <option key={ii} value={ii}>Img {ii + 1}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeColor(ci)}
                          className="p-1.5 rounded-lg hover:bg-red-50 shrink-0"
                        >
                          <X className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Preset color swatches */}
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map((c) => {
                    const isSelected = (editing.colors || []).some((ec) => ec.name.toLowerCase() === c.name.toLowerCase());
                    return (
                      <button
                        key={c.name}
                        type="button"
                        disabled={isSelected}
                        onClick={() => addColor(c.name, c.hex)}
                        title={c.name}
                        className={`w-8 h-8 rounded-lg border-2 transition-all ${isSelected ? 'opacity-30 cursor-not-allowed border-neutral-200' : 'border-neutral-300 hover:scale-110 hover:border-neutral-900'}`}
                        style={{ background: c.hex }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium mb-2">Product Images</label>

                {/* Upload button */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-neutral-300 hover:border-neutral-900 cursor-pointer transition-colors mb-3"
                >
                  <Upload className="w-6 h-6 text-neutral-400" />
                  <span className="text-sm text-neutral-500">رفع صورة من الجهاز</span>
                  <span className="text-xs text-neutral-400">Click to upload from your device</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Image list */}
                <div className="space-y-2">
                  {(editing.images || []).map((img, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      {img ? (
                        <img src={img} alt="" className="w-12 h-12 rounded-lg object-cover bg-neutral-100 shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                          <ImageIcon className="w-5 h-5 text-neutral-300" />
                        </div>
                      )}
                      <input
                        type="url"
                        value={img.startsWith('data:') ? '(uploaded image)' : img}
                        onChange={(e) => updateImage(i, e.target.value)}
                        placeholder="https://..."
                        disabled={img.startsWith('data:')}
                        className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 text-sm outline-none focus:ring-2 focus:ring-neutral-900 disabled:bg-neutral-50 disabled:text-neutral-400"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="p-2 rounded-lg hover:bg-red-50 shrink-0"
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addImage}
                    className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add image URL
                  </button>
                </div>
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <button
                  type="button"
                  onClick={() => setEditing({ ...editing, is_active: !editing.is_active })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${editing.is_active ? 'bg-green-500' : 'bg-neutral-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${editing.is_active ? 'translate-x-5' : ''}`} />
                </button>
                <span className="text-sm font-medium">Visible on storefront</span>
              </label>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-5 py-3 flex gap-3">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 font-semibold text-sm hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl bg-neutral-900 text-white font-semibold text-sm hover:bg-neutral-800"
              >
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
