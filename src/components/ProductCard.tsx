import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import type { Product } from '@/lib/types';
import { useI18n } from '@/lib/i18n';
import { formatPrice } from '@/lib/utils';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { t, dir } = useI18n();
  const [imgIndex, setImgIndex] = useState(0);
  const currentPrice = product.sale_price ?? product.price;
  const hasSale = product.sale_price !== null && product.sale_price < product.price;
  const outOfStock = product.stock <= 0;

  return (
    <RouterLink to={`/product/${product.id}`} className="group flex flex-col" dir={dir}>
      <div
        className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-100 cursor-pointer"
        onMouseEnter={() => product.images.length > 1 && setImgIndex(1)}
        onMouseLeave={() => setImgIndex(0)}
      >
        {product.images.length > 0 ? (
          <img
            src={product.images[imgIndex] || product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-neutral-300" />
          </div>
        )}

        {hasSale && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-red-500 text-white text-xs font-bold">
            {dir === 'rtl' ? 'تخفيض' : 'SALE'}
          </span>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium">
              {t('product.outOfStock')}
            </span>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="w-full py-2.5 rounded-xl bg-white text-neutral-900 font-semibold text-sm text-center">
            {t('product.quickBuy')}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col">
        <h3 className="font-medium text-sm sm:text-base leading-snug">{product.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-bold text-sm sm:text-base" style={{ color: 'var(--accent)' }}>
            {formatPrice(currentPrice)}
          </span>
          {hasSale && (
            <span className="text-xs text-neutral-400 line-through">{formatPrice(product.price)}</span>
          )}
        </div>
        <div className="flex gap-1 mt-2">
          {product.sizes.slice(0, 5).map((s) => (
            <span
              key={s}
              className="px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-500"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </RouterLink>
  );
}
