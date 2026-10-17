import { useState } from 'react';
import { Save, Check, Palette, Store, Phone, Link, Upload, Image as ImageIcon } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { StoreSettings } from '@/lib/types';

export default function AdminSettings() {
  const { settings, saveSettings } = useStore();
  const [form, setForm] = useState<Partial<StoreSettings>>(settings || {});
  const [saved, setSaved] = useState(false);
  const [aiBgImage, setAiBgImage] = useState<string | null>(null);

  if (!settings) return null;

  const handleSave = async () => {
    await saveSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const update = (field: keyof StoreSettings, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAiBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAiBgImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Auto theme adjuster helper - extract dominant color from image
  const extractDominantColor = (imgUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve('#0a0a0a'); return; }
        canvas.width = 50;
        canvas.height = 50;
        ctx.drawImage(img, 0, 0, 50, 50);
        const data = ctx.getImageData(0, 0, 50, 50).data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
        }
        r = Math.round(r / count); g = Math.round(g / count); b = Math.round(b / count);
        resolve(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
      };
      img.onerror = () => resolve('#0a0a0a');
      img.src = imgUrl;
    });
  };

  const applyAutoTheme = async () => {
    const firstProduct = document.querySelector('img[src*="pexels"]') as HTMLImageElement | null;
    if (firstProduct) {
      const color = await extractDominantColor(firstProduct.src);
      update('accent_color', color);
    }
  };

  const sections = [
    { id: 'store', label: 'Store Identity', icon: Store },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'shipping', label: 'Shipping Sender', icon: Phone },
    { id: 'webhook', label: 'Webhook Sync', icon: Link },
    { id: 'ai', label: 'AI Features', icon: ImageIcon },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-neutral-500 text-sm mt-1">Configure your store, appearance, and integrations</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
            saved ? 'bg-green-500 text-white' : 'bg-neutral-900 text-white hover:bg-neutral-800'
          }`}
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Store Identity */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Store className="w-4 h-4" /> Store Identity</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Store Name</label>
            <input
              type="text"
              value={form.store_name ?? ''}
              onChange={(e) => update('store_name', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Admin PIN</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={form.admin_pin ?? ''}
              onChange={(e) => update('admin_pin', e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Hero Title</label>
          <input
            type="text"
            value={form.hero_title ?? ''}
            onChange={(e) => update('hero_title', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Hero Subtitle</label>
          <textarea
            value={form.hero_subtitle ?? ''}
            onChange={(e) => update('hero_subtitle', e.target.value)}
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm outline-none focus:ring-2 focus:ring-neutral-900 resize-none"
          />
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Palette className="w-4 h-4" /> Appearance</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Accent Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={form.accent_color ?? '#0a0a0a'}
                onChange={(e) => update('accent_color', e.target.value)}
                className="w-12 h-10 rounded-lg border border-neutral-200 cursor-pointer"
              />
              <input
                type="text"
                value={form.accent_color ?? ''}
                onChange={(e) => update('accent_color', e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Secondary Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={form.secondary_color ?? '#f5f5f5'}
                onChange={(e) => update('secondary_color', e.target.value)}
                className="w-12 h-10 rounded-lg border border-neutral-200 cursor-pointer"
              />
              <input
                type="text"
                value={form.secondary_color ?? ''}
                onChange={(e) => update('secondary_color', e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
          </div>
        </div>
        <button
          onClick={applyAutoTheme}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-100 text-neutral-700 text-sm font-medium hover:bg-neutral-200 transition-colors"
        >
          <Palette className="w-4 h-4" /> Auto-Adjust Theme from Product Image
        </button>
        <p className="text-xs text-neutral-400">Extracts dominant colors from your product cover images to dynamically set accent colors.</p>
      </div>

      {/* Shipping Sender */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Phone className="w-4 h-4" /> Shipping Sender (Bordereau)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Sender Name</label>
            <input
              type="text"
              value={form.sender_name ?? ''}
              onChange={(e) => update('sender_name', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Sender Phone</label>
            <input
              type="tel"
              value={form.sender_phone ?? ''}
              onChange={(e) => update('sender_phone', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Sender Address</label>
          <input
            type="text"
            value={form.sender_address ?? ''}
            onChange={(e) => update('sender_address', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
      </div>

      {/* Webhook */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Link className="w-4 h-4" /> Webhook Sync (Google Sheets / Zapier)</h3>
        <div>
          <label className="block text-sm font-medium mb-1.5">Webhook URL</label>
          <input
            type="url"
            value={form.webhook_url ?? ''}
            onChange={(e) => update('webhook_url', e.target.value)}
            placeholder="https://hooks.zapier.com/... or Google Sheets webhook"
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
          />
          <p className="text-xs text-neutral-400 mt-1.5">Orders are POST-ed as JSON to this URL upon successful placement.</p>
        </div>
      </div>

      {/* AI Features */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><ImageIcon className="w-4 h-4" /> AI Lifestyle Background Generator</h3>
        <p className="text-sm text-neutral-500">Upload a clothing product PNG to trigger the AI background generation workflow.</p>
        <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center">
          {aiBgImage ? (
            <div className="space-y-3">
              <img src={aiBgImage} alt="Uploaded product" className="max-h-48 mx-auto rounded-lg" />
              <p className="text-sm text-neutral-500">Product image loaded. AI background generation placeholder ready.</p>
              <button
                onClick={() => setAiBgImage(null)}
                className="text-sm text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                Remove and upload another
              </button>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center gap-2">
              <Upload className="w-10 h-10 text-neutral-300" />
              <span className="text-sm text-neutral-500">Click to upload a PNG product image</span>
              <input type="file" accept="image/png" onChange={handleAiBgUpload} className="hidden" />
            </label>
          )}
        </div>
        <p className="text-xs text-neutral-400">
          This is a placeholder for the AI background generation API. Connect your preferred AI image generation service to enable this feature.
        </p>
      </div>
    </div>
  );
}
