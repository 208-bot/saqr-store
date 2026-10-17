import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, Sparkles, BarChart3, Megaphone, MessageCircle, TrendingUp } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useI18n, type Lang } from '@/lib/i18n';
import type { OrderStatus, Order, Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface StoreData {
  products: Product[];
  orders: Order[];
  shippingRates: ReturnType<typeof useStore>['shippingRates'];
  settings: ReturnType<typeof useStore>['settings'];
  saveProduct: ReturnType<typeof useStore>['saveProduct'];
  updateOrderStatus: ReturnType<typeof useStore>['updateOrderStatus'];
}

type LangCode = 'ar' | 'en' | 'fr';

function detectLang(query: string, uiLang: Lang): LangCode {
  const q = query.toLowerCase();
  const hasArabic = /[\u0600-\u06FF]/.test(query);
  if (hasArabic) return 'ar';
  if (uiLang === 'fr' || /\b(le|la|les|bonjour|merci|commande|produit|vente)\b/.test(q)) return 'fr';
  return 'en';
}

function getGreeting(lang: LangCode, storeName: string): string {
  const greetings: Record<LangCode, string> = {
    ar: `أهلا وسهلا بيك! 🚀\nأنا JARVIS، المساعد الذكي بتاع متجر "${storeName}".\nأنا هنا باش نعاونك تحلل المبيعات، تتبع الطلبات، تولّد إعلانات ورسائل واتساب، وتاخذ قرارات ذكية.\n\nقولي على شنو حابب نديرو؟`,
    en: `Welcome back! 🚀\nI'm JARVIS, your AI store partner for "${storeName}".\nI can analyze your sales, track orders, generate ad copy and WhatsApp templates, and give you smart recommendations.\n\nWhat would you like to do?`,
    fr: `Bonjour ! 🚀\nJe suis JARVIS, votre assistant IA pour "${storeName}".\nJe peux analyser vos ventes, suivre les commandes, générer des pubs et messages WhatsApp, et vous donner des recommandations.\n\nQue souhaitez-vous faire ?`,
  };
  return greetings[lang];
}

function computeAnalytics(data: StoreData) {
  const { orders, products } = data;
  const completed = orders.filter((o) => o.status === 'مكتمل');
  const pending = orders.filter((o) => o.status !== 'مكتمل' && o.status !== 'مرتجع');
  const returned = orders.filter((o) => o.status === 'مرتجع');
  const totalRev = completed.reduce((s, o) => s + o.total, 0);
  const pendingRev = pending.reduce((s, o) => s + o.total, 0);
  const avgOrder = orders.length > 0 ? Math.round(orders.reduce((s, o) => s + o.total, 0) / orders.length) : 0;
  const completionRate = orders.length > 0 ? Math.round((completed.length / orders.length) * 100) : 0;
  const returnRate = orders.length > 0 ? Math.round((returned.length / orders.length) * 100) : 0;

  const productSales: Record<string, { count: number; revenue: number }> = {};
  orders.forEach((o) => {
    if (!productSales[o.product_name]) productSales[o.product_name] = { count: 0, revenue: 0 };
    productSales[o.product_name].count += o.quantity;
    productSales[o.product_name].revenue += o.total;
  });
  const topProducts = Object.entries(productSales).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5);

  const wilayaStats: Record<string, { count: number; revenue: number }> = {};
  orders.forEach((o) => {
    if (!wilayaStats[o.wilaya_name]) wilayaStats[o.wilaya_name] = { count: 0, revenue: 0 };
    wilayaStats[o.wilaya_name].count++;
    wilayaStats[o.wilaya_name].revenue += o.total;
  });
  const topWilayas = Object.entries(wilayaStats).sort((a, b) => b[1].count - a[1].count).slice(0, 10);

  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10);
  const outOfStock = products.filter((p) => p.stock <= 0);

  const statusCounts: Record<string, number> = {};
  orders.forEach((o) => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

  return { completed, pending, returned, totalRev, pendingRev, avgOrder, completionRate, returnRate, topProducts, topWilayas, lowStock, outOfStock, statusCounts };
}

type Analytics = ReturnType<typeof computeAnalytics>;

function formatNum(n: number) { return n.toLocaleString('en-US'); }

function respondSales(lang: LangCode, data: StoreData, a: Analytics): string {
  if (lang === 'ar') {
    let r = `📊 تحليل المبيعات:\n\n`;
    r += `• الإيرادات المحققة: ${formatPrice(a.totalRev)} (${a.completed.length} طلب مكتمل)\n`;
    r += `• الإيرادات المعلقة: ${formatPrice(a.pendingRev)} (${a.pending.length} طلب قيد المعالجة)\n`;
    r += `• إجمالي الإمكانيات: ${formatPrice(a.totalRev + a.pendingRev)}\n`;
    r += `• متوسط قيمة الطلب: ${formatPrice(a.avgOrder)}\n`;
    r += `• معدل الإكمال: ${a.completionRate}%\n`;
    r += `• معدل الإرجاع: ${a.returnRate}%\n\n`;
    if (a.returnRate > 15) r += `⚠️ معدل الإرجاع مرتفع! ننصح بمراجعة جودة المنتجات أو تحسين توصيل الولايات ذات الإرجاع الأكثر.\n\n`;
    if (a.pending.length > a.completed.length) r += `💡 عندك طلبات معلقة كثيرة. ننصح بتأكيدها بسرعة باش ما يلغاوش.\n`;
    return r;
  }
  if (lang === 'fr') {
    let r = `📊 Analyse des ventes :\n\n`;
    r += `• Revenu réalisé : ${formatPrice(a.totalRev)} (${a.completed.length} commandes)\n`;
    r += `• Revenu en attente : ${formatPrice(a.pendingRev)} (${a.pending.length} commandes)\n`;
    r += `• Potentiel total : ${formatPrice(a.totalRev + a.pendingRev)}\n`;
    r += `• Panier moyen : ${formatPrice(a.avgOrder)}\n`;
    r += `• Taux de finalisation : ${a.completionRate}%\n`;
    r += `• Taux de retour : ${a.returnRate}%\n\n`;
    if (a.returnRate > 15) r += `⚠️ Le taux de retour est élevé ! Vérifiez la qualité ou la livraison.\n\n`;
    if (a.pending.length > a.completed.length) r += `💡 Beaucoup de commandes en attente. Confirmez-les rapidement.\n`;
    return r;
  }
  let r = `📊 Sales Analysis:\n\n`;
  r += `• Completed Revenue: ${formatPrice(a.totalRev)} (${a.completed.length} orders)\n`;
  r += `• Pending Revenue: ${formatPrice(a.pendingRev)} (${a.pending.length} orders)\n`;
  r += `• Total Potential: ${formatPrice(a.totalRev + a.pendingRev)}\n`;
  r += `• Average Order Value: ${formatPrice(a.avgOrder)}\n`;
  r += `• Completion Rate: ${a.completionRate}%\n`;
  r += `• Return Rate: ${a.returnRate}%\n\n`;
  if (a.returnRate > 15) r += `⚠️ High return rate! Consider reviewing product quality or delivery in high-return wilayas.\n\n`;
  if (a.pending.length > a.completed.length) r += `💡 You have many pending orders. Confirm them quickly to prevent cancellations.\n`;
  return r;
}

function respondStock(lang: LangCode, data: StoreData, a: Analytics): string {
  const { products } = data;
  if (lang === 'ar') {
    let r = `📦 تحليل المخزون:\n\n`;
    r += `• إجمالي المنتجات: ${products.length}\n`;
    r += `• مخزون منخفض (≤10): ${a.lowStock.length}\n`;
    if (a.lowStock.length > 0) r += a.lowStock.map((p) => `  - ${p.name}: ${p.stock} قطعة`).join('\n') + '\n';
    r += `• نفد المخزون: ${a.outOfStock.length}\n`;
    if (a.outOfStock.length > 0) r += a.outOfStock.map((p) => `  - ${p.name}`).join('\n') + '\n\n';
    if (a.outOfStock.length > 0) r += `🔴 ننصح بإعادة تعمير المخزون فوراً للمنتجات النافدة! كل يوم بدون مخزون = مبيعات ضائعة.\n`;
    if (a.lowStock.length > 0 && a.outOfStock.length === 0) r += `🟡 راقب المنتجات ذات المخزون المنخفض. اطلب تعمير قبل ما ينفد.\n`;
    return r;
  }
  if (lang === 'fr') {
    let r = `📦 Analyse du stock :\n\n`;
    r += `• Produits totaux : ${products.length}\n`;
    r += `• Stock faible (≤10) : ${a.lowStock.length}\n`;
    if (a.lowStock.length > 0) r += a.lowStock.map((p) => `  - ${p.name} : ${p.stock} unités`).join('\n') + '\n';
    r += `• Rupture de stock : ${a.outOfStock.length}\n`;
    if (a.outOfStock.length > 0) r += a.outOfStock.map((p) => `  - ${p.name}`).join('\n') + '\n\n';
    if (a.outOfStock.length > 0) r += `🔴 Réapprovisionnez immédiatement ! Chaque jour sans stock = ventes perdues.\n`;
    return r;
  }
  let r = `📦 Stock Analysis:\n\n`;
  r += `• Total Products: ${products.length}\n`;
  r += `• Low Stock (≤10): ${a.lowStock.length}\n`;
  if (a.lowStock.length > 0) r += a.lowStock.map((p) => `  - ${p.name}: ${p.stock} units`).join('\n') + '\n';
  r += `• Out of Stock: ${a.outOfStock.length}\n`;
  if (a.outOfStock.length > 0) r += a.outOfStock.map((p) => `  - ${p.name}`).join('\n') + '\n\n';
  if (a.outOfStock.length > 0) r += `🔴 Restock immediately! Every day without stock = lost sales.\n`;
  if (a.lowStock.length > 0 && a.outOfStock.length === 0) r += `🟡 Monitor low-stock products. Order before they run out.\n`;
  return r;
}

function respondTopProducts(lang: LangCode, data: StoreData, a: Analytics): string {
  if (a.topProducts.length === 0) return lang === 'ar' ? 'ما كاين حتى طلبات بعد. المنتجات الأكثر مبيعاً تظهر مع أول طلب.' : lang === 'fr' ? 'Aucune commande encore.' : 'No orders yet.';
  if (lang === 'ar') {
    let r = `🏆 أفضل المنتجات مبيعاً:\n\n`;
    r += a.topProducts.map(([name, d], i) => `  ${i + 1}. ${name} — ${d.count} مبيع — ${formatPrice(d.revenue)}`).join('\n');
    r += `\n\n💡 المنتج الأكثر مبيعاً "${a.topProducts[0][0]}" — ننصح بزيادة مخزونه والترويج له أكثر لأنه الأكثر طلباً.`;
    return r;
  }
  if (lang === 'fr') {
    let r = `🏆 Top produits :\n\n`;
    r += a.topProducts.map(([name, d], i) => `  ${i + 1}. ${name} — ${d.count} vendus — ${formatPrice(d.revenue)}`).join('\n');
    r += `\n\n💡 "${a.topProducts[0][0]}" est le plus vendu. Augmentez le stock et promoirez-le.`;
    return r;
  }
  let r = `🏆 Top Products by Revenue:\n\n`;
  r += a.topProducts.map(([name, d], i) => `  ${i + 1}. ${name} — ${d.count} sold — ${formatPrice(d.revenue)}`).join('\n');
  r += `\n\n💡 "${a.topProducts[0][0]}" is your best seller. Consider increasing stock and promoting it more.`;
  return r;
}

function respondWilayas(lang: LangCode, data: StoreData, a: Analytics): string {
  if (a.topWilayas.length === 0) return lang === 'ar' ? 'ما كاين بيانات كافية.' : 'Not enough data yet.';
  if (lang === 'ar') {
    let r = `🗺️ أهم الولايات بالطلبات:\n\n`;
    r += a.topWilayas.map(([name, d], i) => `  ${i + 1}. ${name} — ${d.count} طلب — ${formatPrice(d.revenue)}`).join('\n');
    r += `\n\n💡 ركّز إعلاناتك على الولايات الأولى لأنها تجلب أكبر عدد من الزبائن.`;
    return r;
  }
  if (lang === 'fr') {
    let r = `🗺️ Top wilayas :\n\n`;
    r += a.topWilayas.map(([name, d], i) => `  ${i + 1}. ${name} — ${d.count} — ${formatPrice(d.revenue)}`).join('\n');
    r += `\n\n💡 Concentrez vos pubs sur les wilayas les plus actives.`;
    return r;
  }
  let r = `🗺️ Top Wilayas by Orders:\n\n`;
  r += a.topWilayas.map(([name, d], i) => `  ${i + 1}. ${name} — ${d.count} orders — ${formatPrice(d.revenue)}`).join('\n');
  r += `\n\n💡 Focus your ads on the top wilayas — they bring the most customers.`;
  return r;
}

function respondRecommendations(lang: LangCode, data: StoreData, a: Analytics): string {
  const recs: string[] = [];
  const { products, orders } = data;

  if (a.outOfStock.length > 0) {
    if (lang === 'ar') recs.push(`🔴 أعد تعمير ${a.outOfStock.length} منتج نفد من المخزون فوراً. كل يوم = مبيعات ضائعة.`);
    else if (lang === 'fr') recs.push(`🔴 Réapprovisionnez ${a.outOfStock.length} produit(s) en rupture.`);
    else recs.push(`🔴 Restock ${a.outOfStock.length} out-of-stock product(s) immediately.`);
  }
  if (a.lowStock.length > 0) {
    if (lang === 'ar') recs.push(`🟡 ${a.lowStock.length} منتج قرب ينفد. اطلب تعمير قبل ما يخلص.`);
    else if (lang === 'fr') recs.push(`🟡 ${a.lowStock.length} produit(s) bientôt en rupture.`);
    else recs.push(`🟡 ${a.lowStock.length} product(s) running low. Order restocks soon.`);
  }
  if (a.pending.length > 5) {
    if (lang === 'ar') recs.push(`📞 عندك ${a.pending.length} طلب معلق. اتصل بالزبائن لتأكيدها قبل ما يلغاوش.`);
    else if (lang === 'fr') recs.push(`📞 ${a.pending.length} commandes en attente. Confirmez-les rapidement.`);
    else recs.push(`📞 You have ${a.pending.length} pending orders. Call customers to confirm before they cancel.`);
  }
  if (a.returnRate > 15) {
    if (lang === 'ar') recs.push(`⚠️ معدل الإرجاع ${a.returnRate}% مرتفع جداً. راجع جودة المنتجات أو الولايات ذات الإرجاع الأكثر.`);
    else if (lang === 'fr') recs.push(`⚠️ Taux de retour ${a.returnRate}% trop élevé. Vérifiez la qualité.`);
    else recs.push(`⚠️ Return rate ${a.returnRate}% is too high. Review quality or delivery issues.`);
  }
  if (a.topProducts.length > 0 && a.topProducts.length >= 2) {
    const best = a.topProducts[0][0];
    if (lang === 'ar') recs.push(`⭐ "${best}" هو الأكثر مبيعاً. زيد مخزونه وزيد الترويج عليه بإعلان خاص.`);
    else if (lang === 'fr') recs.push(`⭐ "${best}" est le best-seller. Augmentez le stock et la promo.`);
    else recs.push(`⭐ "${best}" is your best seller. Increase stock and run a special ad.`);
  }
  const noSaleProducts = products.filter((p) => p.is_active && !orders.some((o) => o.product_name === p.name));
  if (noSaleProducts.length > 0) {
    if (lang === 'ar') recs.push(`💤 ${noSaleProducts.length} منتج ما عندوش مبيعات. جرّب تخفيض أو إعلان لتنشيطها.`);
    else if (lang === 'fr') recs.push(`💤 ${noSaleProducts.length} produit(s) sans vente. Essayez une promo.`);
    else recs.push(`💤 ${noSaleProducts.length} product(s) with zero sales. Try a discount or ad campaign.`);
  }

  if (recs.length === 0) {
    if (lang === 'ar') return `🎉 كل شيء يبدو ممتاز! المتجر في وضع جيد. استمر في الترويج ومتابعة الطلبات.`;
    if (lang === 'fr') return `🎉 Tout semble excellent ! Continuez vos efforts.`;
    return `🎉 Everything looks great! Your store is in good shape. Keep promoting and tracking orders.`;
  }
  const header = lang === 'ar' ? '🎯 توصياتي الذكية لك:' : lang === 'fr' ? '🎯 Mes recommandations :' : '🎯 My Smart Recommendations:';
  return header + '\n\n' + recs.map((r) => `• ${r}`).join('\n');
}

function respondAdCopy(lang: LangCode, data: StoreData): string {
  const { products, settings } = data;
  const topProd = products.find((p) => p.is_active);
  const storeName = settings?.store_name || 'SAQR STORE';
  const productName = topProd?.name || 'المنتج';
  const price = topProd ? (topProd.sale_price ?? topProd.price) : 3500;

  if (lang === 'ar') {
    return `📢 نص إعلاني جزائري جذّاب:\n\n"${productName} وصل! 🔥\nجودة بريميوم، سعر ما يتلقا حتى فين.\n✅ الدفع عند الاستلام\n✅ توصيل لكل 58 ولاية\n✅ منزل أو أجانس\nالسعر: ${formatPrice(price)} فقط\n\nاطلب الآن قبل ما يخلص المخزون!\n\uD83D\uDC49 ارسل لنا رسالة واختر المقاس والولاية"\n\n💡 نصيحة: استعمل هذا النص في إعلانات Facebook/Instagram مع صورة المنتج. بدّل السعر والمنتج حسب الحملة.`;
  }
  if (lang === 'fr') {
    return `📢 Texte publicitaire (dialecte algérien) :\n\n"${productName} est là ! 🔥\nQualité premium, prix imbattable.\n✅ Paiement à la livraison\n✅ Livraison 58 wilayas\n✅ Domicile ou agence\nPrix : ${formatPrice(price)} seulement\n\nCommandez avant rupture de stock !\n\uD83D\uDC49 Envoyez-nous un message"\n\n💡 Utilisez ce texte pour vos pubs Facebook/Instagram avec une photo du produit.`;
  }
  return `📢 Ad Copy (Algerian Arabic):\n\n"${productName} wsel! 🔥\nQualité premium, prix ma tlqah fink.\n✅ Khlas 3and l9istlass\n✅ Twsil l kol 58 wilaya\n✅ Dar wla agence\nPrix: ${formatPrice(price)} ghir\n\nAtlob daba 9bel ma ykhemm l stock!\n\uD83D\uDC49 A3tina message w khter l size wil wilaya"\n\n💡 Use this in Facebook/Instagram ads with a product photo.`;
}

function respondWhatsApp(lang: LangCode, data: StoreData, a: Analytics): string {
  const pendingOrders = a.pending.slice(0, 3);
  if (pendingOrders.length === 0) {
    if (lang === 'ar') return `ما كاين طلبات معلقة حالياً. كلشي تأكد! 👍`;
    if (lang === 'fr') return `Aucune commande en attente. Tout est confirmé ! 👍`;
    return `No pending orders. Everything is confirmed! 👍`;
  }
  const first = pendingOrders[0];
  if (lang === 'ar') {
    return `📱 قالب رسالة واتساب للطلب المعلق:\n\n"سلام ${first.customer_name} 👋\nأنا من ${data.settings?.store_name || 'المتجر'}، عندنا طلبك ${first.order_number}.\nطلبتي: ${first.product_name} (المقاس: ${first.product_size}) — الكمية: ${first.quantity}\nالمجموع: ${formatPrice(first.total)} (التوصيل لـ ${first.wilaya_name})\n\nنحتاج نأكدو الطلب باش نرسلوه لك. واش راه مزال حابب الطلب؟\nالدفع عند الاستلام ✅"\n\n💡 انسخ النص وبدّل المعلومات لكل زبون. اتصل في أقرب وقت باش ما يلغيش الطلب.`;
  }
  if (lang === 'fr') {
    return `📱 Modèle WhatsApp pour commande en attente :\n\n"Salam ${first.customer_name} 👋\nJe suis de ${data.settings?.store_name || 'la boutique'}, votre commande ${first.order_number}.\nProduit: ${first.product_name} (Taille: ${first.product_size}) — Qté: ${first.quantity}\nTotal: ${formatPrice(first.total)} (Livraison ${first.wilaya_name})\n\nConfirmez-vous la commande ?\nPaiement à la livraison ✅"\n\n💡 Copiez et adaptez pour chaque client.`;
  }
  return `📱 WhatsApp template for pending order:\n\n"Hi ${first.customer_name} 👋\nThis is ${data.settings?.store_name || 'the store'}, regarding order ${first.order_number}.\nProduct: ${first.product_name} (Size: ${first.product_size}) — Qty: ${first.quantity}\nTotal: ${formatPrice(first.total)} (Delivery to ${first.wilaya_name})\n\nCan you confirm your order so we can ship it?\nCash on delivery ✅"\n\n💡 Copy and customize for each customer.`;
}

function respondPricing(lang: LangCode, data: StoreData, a: Analytics): string {
  const { products } = data;
  if (products.length === 0) return lang === 'ar' ? 'ما كاين منتجات.' : 'No products.';

  if (lang === 'ar') {
    let r = `💰 استراتيجية التسعير:\n\n`;
    products.slice(0, 5).forEach((p) => {
      const currentPrice = p.sale_price ?? p.price;
      const margin = currentPrice - p.purchase_cost;
      const marginPct = p.purchase_cost > 0 ? Math.round((margin / p.purchase_cost) * 100) : 0;
      const sales = a.topProducts.find(([n]) => n === p.name)?.[1].count ?? 0;
      r += `• ${p.name}:\n  السعر: ${formatPrice(currentPrice)} | التكلفة: ${formatPrice(p.purchase_cost)} | الربح: ${formatPrice(margin)} (${marginPct}%)\n`;
      if (marginPct < 30) r += `  ⚠️ الهامش منخفض — ننصح بزيادة السعر.\n`;
      else if (sales > 5 && marginPct > 60) r += `  💡 يبيع جيداً وهامش ممتاز — يمكن تجرّب زيادة طفيفة.\n`;
      else if (sales === 0 && marginPct > 60) r += `  💡 مبيعات ضعيفة — جرّب تخفيض مؤقت لجذب الزبائن.\n`;
    });
    r += `\n📌 قاعدة: اهدف لهامش ربح 40-70% على كل منتج.`;
    return r;
  }
  if (lang === 'fr') {
    let r = `💰 Stratégie de prix :\n\n`;
    products.slice(0, 5).forEach((p) => {
      const currentPrice = p.sale_price ?? p.price;
      const margin = currentPrice - p.purchase_cost;
      const marginPct = p.purchase_cost > 0 ? Math.round((margin / p.purchase_cost) * 100) : 0;
      r += `• ${p.name}: Prix ${formatPrice(currentPrice)} | Coût ${formatPrice(p.purchase_cost)} | Marge ${formatPrice(margin)} (${marginPct}%)\n`;
    });
    r += `\n📌 Visez une marge de 40-70%.`;
    return r;
  }
  let r = `💰 Pricing Strategy:\n\n`;
  products.slice(0, 5).forEach((p) => {
    const currentPrice = p.sale_price ?? p.price;
    const margin = currentPrice - p.purchase_cost;
    const marginPct = p.purchase_cost > 0 ? Math.round((margin / p.purchase_cost) * 100) : 0;
    const sales = a.topProducts.find(([n]) => n === p.name)?.[1].count ?? 0;
    r += `• ${p.name}: Price ${formatPrice(currentPrice)} | Cost ${formatPrice(p.purchase_cost)} | Margin ${formatPrice(margin)} (${marginPct}%)\n`;
    if (marginPct < 30) r += `  ⚠️ Low margin — consider raising price.\n`;
    else if (sales > 5 && marginPct > 60) r += `  💡 Sells well + great margin — try a slight increase.\n`;
    else if (sales === 0 && marginPct > 60) r += `  💡 No sales — try a temporary discount.\n`;
  });
  r += `\n📌 Rule of thumb: aim for 40-70% margin on each product.`;
  return r;
}

function respondSummary(lang: LangCode, data: StoreData, a: Analytics): string {
  const { products, orders, shippingRates, settings } = data;
  if (lang === 'ar') {
    let r = `📋 ملخص المتجر:\n\n`;
    r += `• المتجر: ${settings?.store_name || 'SAQR STORE'}\n`;
    r += `• المنتجات: ${products.length} (${products.filter((p) => p.is_active).length} ظاهر)\n`;
    r += `• الطلبات: ${orders.length} إجمالي\n`;
    r += `• الإيرادات المحققة: ${formatPrice(a.totalRev)}\n`;
    r += `• الإيرادات المعلقة: ${formatPrice(a.pendingRev)}\n`;
    r += `• التوصيل: ${shippingRates.length} ولاية مُهيأة\n`;
    r += `• معدل الإكمال: ${a.completionRate}%\n`;
    if (a.outOfStock.length > 0) r += `• نفد المخزون: ${a.outOfStock.length} منتج ⚠️\n`;
    return r;
  }
  if (lang === 'fr') {
    let r = `📋 Résumé du magasin :\n\n`;
    r += `• Magasin : ${settings?.store_name || 'SAQR STORE'}\n`;
    r += `• Produits : ${products.length} (${products.filter((p) => p.is_active).length} actifs)\n`;
    r += `• Commandes : ${orders.length}\n`;
    r += `• Revenu réalisé : ${formatPrice(a.totalRev)}\n`;
    r += `• Revenu en attente : ${formatPrice(a.pendingRev)}\n`;
    r += `• Livraison : ${shippingRates.length} wilayas\n`;
    r += `• Taux de finalisation : ${a.completionRate}%\n`;
    return r;
  }
  let r = `📋 Store Summary:\n\n`;
  r += `• Store: ${settings?.store_name || 'SAQR STORE'}\n`;
  r += `• Products: ${products.length} (${products.filter((p) => p.is_active).length} active)\n`;
  r += `• Orders: ${orders.length} total\n`;
  r += `• Completed Revenue: ${formatPrice(a.totalRev)}\n`;
  r += `• Pending Revenue: ${formatPrice(a.pendingRev)}\n`;
  r += `• Shipping: ${shippingRates.length} wilayas configured\n`;
  r += `• Completion Rate: ${a.completionRate}%\n`;
  if (a.outOfStock.length > 0) r += `• Out of Stock: ${a.outOfStock.length} ⚠️\n`;
  return r;
}

function respondFallback(lang: LangCode): string {
  if (lang === 'ar') {
    return `مرحبا! 😊 أنا JARVIS، مساعدك الذكي. نقدر نعاونك في:\n\n• "حلل المبيعات" — تحليل الإيرادات والأداء\n• "المخزون" — فحص المخزون والتنبيهات\n• "أفضل المنتجات" — الأكثر مبيعاً\n• "الولايات" — أداء التوصيل\n• "توصيات" — نصائح ذكية لمتجرك\n• "إعلان" — توليد نص إعلاني جذّاب\n• "واتساب" — قالب رسالة للطلبات المعلقة\n• "تسعير" — استراتيجية الأسعار\n• "ملخص" — نظرة عامة سريعة\n\nقولي شنو حابب نديرو؟ 🚀`;
  }
  if (lang === 'fr') {
    return `Bonjour ! 😊 Je suis JARVIS. Je peux vous aider avec :\n\n• "Ventes" — analyse des revenus\n• "Stock" — vérification du stock\n• "Top produits" — les plus vendus\n• "Wilayas" — performance livraison\n• "Recommandations" — conseils\n• "Pub" — générer un texte publicitaire\n• "WhatsApp" — modèle de message\n• "Prix" — stratégie de prix\n• "Résumé" — aperçu rapide\n\nQue souhaitez-vous ? 🚀`;
  }
  return `Hi! 😊 I'm JARVIS, your AI store partner. I can help with:\n\n• "Sales" — revenue analysis\n• "Stock" — inventory check\n• "Top products" — best sellers\n• "Wilayas" — delivery performance\n• "Recommendations" — smart tips\n• "Ad copy" — generate ad text\n• "WhatsApp" — message template\n• "Pricing" — pricing strategy\n• "Summary" — quick overview\n\nWhat can I do for you? 🚀`;
}

function tryPriceUpdate(lang: LangCode, data: StoreData, query: string): string | null {
  const { products, saveProduct } = data;
  const q = query.toLowerCase();
  const hasPriceUpdate = q.includes('update price') || q.includes('change price') || q.includes('set price') || q.includes('غيّر سعر') || q.includes('بدّل سعر') || q.includes('سعر');
  if (!hasPriceUpdate) return null;

  const productMatch = products.find((p) => q.includes(p.name.toLowerCase()));
  const priceMatch = q.match(/(\d+)\s*da?/i);
  if (productMatch && priceMatch) {
    const newPrice = parseInt(priceMatch[1]);
    saveProduct({ id: productMatch.id, price: newPrice });
    if (lang === 'ar') return `✅ تم تغيير سعر "${productMatch.name}" إلى ${formatPrice(newPrice)}. التحديث مباشر في المتجر!`;
    if (lang === 'fr') return `✅ Prix de "${productMatch.name}" mis à jour à ${formatPrice(newPrice)}. En ligne !`;
    return `✅ Updated "${productMatch.name}" price to ${formatPrice(newPrice)}. It's now live on your storefront!`;
  }
  if (lang === 'ar') return `باش نبدّل سعر، قولي: "بدّل سعر [اسم المنتج] إلى [السعر] دج"\n\nالمنتجات:\n${products.map((p) => `  • ${p.name} — ${formatPrice(p.sale_price ?? p.price)}`).join('\n')}`;
  if (lang === 'fr') return `Pour changer un prix, dites : "Changer prix [nom] à [montant] DA"\n\nProduits :\n${products.map((p) => `  • ${p.name} — ${formatPrice(p.sale_price ?? p.price)}`).join('\n')}`;
  return `To update a price, tell me: "Update price [product name] to [amount] DA"\n\nProducts:\n${products.map((p) => `  • ${p.name} — ${formatPrice(p.sale_price ?? p.price)}`).join('\n')}`;
}

function tryConfirmOrder(lang: LangCode, data: StoreData, query: string): string | null {
  const { orders, updateOrderStatus } = data;
  const q = query.toLowerCase();
  if (!(q.includes('confirm') && q.includes('order') || q.includes('تأكد') && q.includes('طلب') || q.includes('confirmé'))) return null;

  const orderMatch = orders.find((o) => q.includes(o.order_number.toLowerCase()));
  if (orderMatch) {
    updateOrderStatus(orderMatch.id, 'مؤكد' as OrderStatus);
    if (lang === 'ar') return `✅ تم تأكيد الطلب ${orderMatch.order_number} (مؤكد).`;
    if (lang === 'fr') return `✅ Commande ${orderMatch.order_number} confirmée.`;
    return `✅ Order ${orderMatch.order_number} has been confirmed.`;
  }
  return null;
}

function generateResponse(query: string, data: StoreData, uiLang: Lang): string {
  const lang = detectLang(query, uiLang);
  const a = computeAnalytics(data);
  const q = query.toLowerCase().trim();

  const priceUpdate = tryPriceUpdate(lang, data, query);
  if (priceUpdate) return priceUpdate;

  const orderConfirm = tryConfirmOrder(lang, data, query);
  if (orderConfirm) return orderConfirm;

  if (q.includes('revenue') || q.includes('sales') || q.includes('مبيع') || q.includes('إيراد') || q.includes('vente') || q.includes('حلل') || q.includes('أداء'))
    return respondSales(lang, data, a);

  if (q.includes('stock') || q.includes('inventory') || q.includes('مخزون') || q.includes('stock'))
    return respondStock(lang, data, a);

  if (q.includes('best') || q.includes('top') || q.includes('popular') || q.includes('أفضل') || q.includes('الأكثر') || q.includes('top produit'))
    return respondTopProducts(lang, data, a);

  if (q.includes('wilaya') || q.includes('ولاية') || q.includes('region') || q.includes('التوصيل'))
    return respondWilayas(lang, data, a);

  if (q.includes('recommend') || q.includes('توصيات') || q.includes('نصائح') || q.includes('conseil') || q.includes('اقتراح'))
    return respondRecommendations(lang, data, a);

  if (q.includes('ad') || q.includes('إعلان') || q.includes('pub') || q.includes('marketing') || q.includes('تسويق'))
    return respondAdCopy(lang, data);

  if (q.includes('whatsapp') || q.includes('واتساب') || q.includes('message') || q.includes('رسالة') || q.includes('follow') || q.includes('متابعة'))
    return respondWhatsApp(lang, data, a);

  if (q.includes('pric') || q.includes('تسعير') || q.includes('أسعار') || q.includes('prix') || q.includes('strateg'))
    return respondPricing(lang, data, a);

  if (q.includes('summary') || q.includes('overview') || q.includes('ملخص') || q.includes('résumé') || q.includes('aperçu'))
    return respondSummary(lang, data, a);

  return respondFallback(lang);
}

export default function AdminAIAssistant() {
  const store = useStore();
  const { products, orders, shippingRates, settings, updateOrderStatus, saveProduct } = store;
  const { lang } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const storeName = settings?.store_name || 'SAQR STORE';

  useEffect(() => {
    setMessages([{ role: 'assistant', content: getGreeting(detectLang('', lang), storeName) }]);
  }, [lang, storeName]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, processing]);

  const handleSend = async () => {
    if (!input.trim() || processing) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setProcessing(true);

    await new Promise((r) => setTimeout(r, 400 + Math.random() * 500));

    const data: StoreData = { products, orders, shippingRates, settings, saveProduct, updateOrderStatus };
    const response = generateResponse(userMsg, data, lang);
    setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    setProcessing(false);
  };

  const quickPrompts: { label: string; icon: typeof BarChart3; prompt: string }[] = [
    { label: lang === 'ar' ? 'تحليل المبيعات' : lang === 'fr' ? 'Ventes' : 'Sales', icon: BarChart3, prompt: lang === 'ar' ? 'حلل المبيعات' : lang === 'fr' ? 'Analyse des ventes' : 'Analyze sales' },
    { label: lang === 'ar' ? 'توصيات' : lang === 'fr' ? 'Conseils' : 'Tips', icon: Sparkles, prompt: lang === 'ar' ? 'توصيات' : lang === 'fr' ? 'Recommandations' : 'Recommendations' },
    { label: lang === 'ar' ? 'إعلان' : lang === 'fr' ? 'Pub' : 'Ad copy', icon: Megaphone, prompt: lang === 'ar' ? 'إعلان' : lang === 'fr' ? 'Pub' : 'Ad copy' },
    { label: lang === 'ar' ? 'واتساب' : 'WhatsApp', icon: MessageCircle, prompt: lang === 'ar' ? 'واتساب' : 'WhatsApp' },
    { label: lang === 'ar' ? 'تسعير' : lang === 'fr' ? 'Prix' : 'Pricing', icon: TrendingUp, prompt: lang === 'ar' ? 'تسعير' : lang === 'fr' ? 'Stratégie de prix' : 'Pricing strategy' },
    { label: lang === 'ar' ? 'المخزون' : lang === 'fr' ? 'Stock' : 'Stock', icon: BarChart3, prompt: lang === 'ar' ? 'المخزون' : lang === 'fr' ? 'Stock' : 'Stock check' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 text-black">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 text-gray-900">
          <Bot className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          JARVIS AI
          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">Assistant</span>
        </h1>
        <p className="text-gray-600 text-sm mt-1 font-bold">
          {lang === 'ar' ? 'مساعدك الذكي — يحلل، ينصح، ويولّد المحتوى لمتجرك' : lang === 'fr' ? 'Votre assistant IA — analyse, conseille et génère du contenu' : 'Your AI partner — analyzes, recommends, and generates content'}
        </p>
      </div>

      <div className="w-full bg-white rounded-2xl border border-gray-200 flex flex-col h-[calc(100dvh-13rem)] min-h-[460px] shadow-xl overflow-hidden">
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto bg-white px-3 sm:px-5 py-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[88%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm sm:text-[15px] leading-relaxed whitespace-pre-line font-bold ${
                msg.role === 'user'
                  ? 'bg-[#d7ad5e] text-black rounded-br-sm shadow-md'
                  : 'bg-gray-50 text-gray-900 border-2 border-gray-200 rounded-bl-sm shadow-sm'
              }`}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-gray-200">
                    <Bot className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
                    <span className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wide">JARVIS</span>
                  </div>
                )}
                {msg.content}
              </div>
            </div>
          ))}
          {processing && (
            <div className="flex justify-start">
              <div className="bg-gray-50 text-gray-900 rounded-2xl rounded-bl-sm px-4 py-3 border-2 border-gray-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                  <span className="text-xs font-bold text-gray-500">
                    {lang === 'ar' ? 'JARVIS يفكّر...' : lang === 'fr' ? 'JARVIS réfléchit...' : 'JARVIS thinking...'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick prompts */}
        <div className="px-3 sm:px-5 pb-2 pt-2 flex flex-wrap gap-1.5 bg-white border-t border-gray-100">
          {quickPrompts.map((qp) => {
            const Icon = qp.icon;
            return (
              <button
                key={qp.label}
                onClick={() => { setInput(qp.prompt); }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 text-gray-800 text-[11px] sm:text-xs font-bold border border-gray-200 hover:bg-[#d7ad5e]/10 hover:border-[#d7ad5e]/40 hover:text-black transition-all"
              >
                <Icon className="w-3 h-3 shrink-0" style={{ color: 'var(--accent)' }} />
                {qp.label}
              </button>
            );
          })}
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-3 bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={lang === 'ar' ? 'اسأل JARVIS أي شيء...' : lang === 'fr' ? 'Demandez à JARVIS...' : 'Ask JARVIS anything...'}
              className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-black font-bold text-sm sm:text-[15px] outline-none focus:ring-2 focus:ring-[#d7ad5e] focus:border-transparent placeholder:text-gray-400 placeholder:font-bold"
            />
            <button
              onClick={handleSend}
              disabled={processing || !input.trim()}
              className="shrink-0 p-2.5 rounded-xl bg-[#d7ad5e] text-black hover:bg-[#edcb82] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
