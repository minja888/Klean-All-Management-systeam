"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useI18n } from "@/components/i18n-provider";
import { PageTips } from "@/components/page-tips";
import { api } from "@/lib/client";
import { formatTZS, toNumber } from "@/lib/money";
import { PageHeader, Card, inputClass, btnPrimary, Money } from "@/components/ui";
import { ReceiptModal } from "@/components/receipt";
import type { TranslationKey } from "@/lib/i18n";

interface Product { id: string; name: string; unit: string; sellingPrice: string | number; currentStock: number }
interface Customer { id: string; name: string }
interface CartLine { productId: string; name: string; unit: string; quantity: number; unitPrice: number }

const METHODS = ["Cash", "M-Pesa", "Bank"];

export default function PosPage() {
  const { t } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [method, setMethod] = useState("Cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [receiptSaleId, setReceiptSaleId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setProducts(await api.get<Product[]>("/api/products"));
      setCustomers(await api.get<Customer[]>("/api/customers"));
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load"); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [products, search],
  );
  const total = useMemo(() => cart.reduce((s, l) => s + l.quantity * l.unitPrice, 0), [cart]);

  function addToCart(p: Product) {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === p.id);
      if (existing) return prev.map((l) => (l.productId === p.id ? { ...l, quantity: l.quantity + 1 } : l));
      return [...prev, { productId: p.id, name: p.name, unit: p.unit, quantity: 1, unitPrice: toNumber(p.sellingPrice) }];
    });
  }
  function updateLine(id: string, patch: Partial<CartLine>) {
    setCart((prev) => prev.map((l) => (l.productId === id ? { ...l, ...patch } : l)));
  }
  function removeLine(id: string) { setCart((prev) => prev.filter((l) => l.productId !== id)); }

  async function checkout() {
    if (cart.length === 0) return;
    setSaving(true); setError(null);
    try {
      const sale = await api.post<{ id: string }>("/api/sales", {
        customerId: customerId || null,
        amountPaid: Number(amountPaid || 0),
        paymentMethod: method,
        items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity, unitPrice: l.unitPrice })),
      });
      setReceiptSaleId(sale.id);
      setCart([]); setCustomerId(""); setAmountPaid("");
      await load(); // refresh stock counts
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to complete sale"); }
    finally { setSaving(false); }
  }

  const paid = Number(amountPaid || 0);
  const balance = total - paid;

  return (
    <div className="space-y-4">
      <PageHeader title={t("pos.title")} />
      <PageTips tipKey="tips.pos" />
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Products */}
        <div className="lg:col-span-2 space-y-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("pos.searchProduct")} className={inputClass} />
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p) => (
              <button key={p.id} onClick={() => addToCart(p)}
                className="text-left bg-white rounded-lg border border-slate-200 p-3 hover:border-emerald-400 hover:shadow-sm transition">
                <div className="font-medium text-slate-800 text-sm">{p.name}</div>
                <div className="text-xs text-slate-500 mt-1">{formatTZS(p.sellingPrice)} · {p.currentStock} {p.unit}</div>
              </button>
            ))}
            {filtered.length === 0 && <p className="text-sm text-slate-400">{t("common.noData")}</p>}
          </div>
        </div>

        {/* Cart */}
        <Card className="p-4 h-fit sticky top-4">
          <div className="font-semibold text-slate-800 mb-2">{t("pos.cart")}</div>
          {cart.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">{t("pos.emptyCart")}</p>
          ) : (
            <div className="space-y-2 mb-3">
              {cart.map((l) => (
                <div key={l.productId} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-800 truncate">{l.name}</div>
                    <div className="text-xs text-slate-400">{formatTZS(l.unitPrice)}</div>
                  </div>
                  <input type="number" min="0" step="any" value={l.quantity}
                    onChange={(e) => updateLine(l.productId, { quantity: Number(e.target.value) })}
                    className="w-16 rounded border border-slate-300 px-2 py-1 text-sm" />
                  <div className="w-20 text-right text-sm text-slate-700">{formatTZS(l.quantity * l.unitPrice)}</div>
                  <button onClick={() => removeLine(l.productId)} className="text-red-500 hover:text-red-700">×</button>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-slate-100 pt-3 space-y-3">
            <div className="flex justify-between font-semibold text-slate-800">
              <span>{t("pos.total")}</span><Money value={total} />
            </div>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={inputClass}>
              <option value="">{t("pos.walkIn")}</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputClass}>
              {METHODS.map((m) => <option key={m} value={m}>{t(`method.${m}` as TranslationKey)}</option>)}
            </select>
            <input type="number" min="0" step="any" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)}
              placeholder={t("pos.amountPaid")} className={inputClass} />
            {balance > 0 && <div className="text-sm text-red-600">{t("pos.balance")}: {formatTZS(balance)}</div>}
            <button onClick={checkout} disabled={saving || cart.length === 0} className={btnPrimary + " w-full"}>
              {saving ? t("common.loading") : t("pos.completeSale")}
            </button>
          </div>
        </Card>
      </div>

      {receiptSaleId && <ReceiptModal saleId={receiptSaleId} onClose={() => setReceiptSaleId(null)} />}
    </div>
  );
}
