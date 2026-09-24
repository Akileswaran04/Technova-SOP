/**
 * SellerNegotiationTab — configure per-product negotiation rules and
 * respond to incoming buyer offers (accept/reject/counter).
 */
import { useState, useEffect, useCallback } from 'react';
import { getNegotiationRule, setNegotiationRule, listMyOffers, respondToOffer } from '../../../services/storage';

function RuleEditor({ products, onToast }) {
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [rule, setRule] = useState({ enabled: false, minPrice: '', autoAcceptThreshold: '', maxRounds: 2 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!productId) return;
    getNegotiationRule(productId).then((r) => {
      if (r) {
        setRule({
          enabled: r.enabled, minPrice: r.min_price, autoAcceptThreshold: r.auto_accept_threshold ?? '',
          maxRounds: r.max_rounds,
        });
      } else {
        const product = products.find((p) => p.id === Number(productId));
        setRule({ enabled: false, minPrice: product ? Math.round(product.price * 0.8) : '', autoAcceptThreshold: '', maxRounds: 2 });
      }
    });
  }, [productId, products]);

  const save = async () => {
    if (!rule.minPrice) {
      onToast?.('Set a minimum price', 'error');
      return;
    }
    setSaving(true);
    try {
      await setNegotiationRule(productId, {
        enabled: rule.enabled,
        minPrice: Number(rule.minPrice),
        autoAcceptThreshold: rule.autoAcceptThreshold ? Number(rule.autoAcceptThreshold) : null,
        maxRounds: Number(rule.maxRounds),
      });
      onToast?.('Negotiation rule saved');
    } catch (err) {
      onToast?.(err.message || 'Could not save rule', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 space-y-3">
      <h3 className="text-title-sm text-on-surface font-semibold">Negotiation Rules</h3>
      <select
        value={productId}
        onChange={(e) => setProductId(e.target.value)}
        className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-body-sm"
      >
        {products.map((p) => <option key={p.id} value={p.id}>{p.name} — ${p.price}</option>)}
      </select>

      <label className="flex items-center gap-2 text-label-md text-on-surface">
        <input type="checkbox" checked={rule.enabled} onChange={(e) => setRule({ ...rule, enabled: e.target.checked })} />
        Allow buyers to negotiate this product
      </label>

      {rule.enabled && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-label-sm text-on-surface-variant">Minimum price</label>
            <input type="number" value={rule.minPrice} onChange={(e) => setRule({ ...rule, minPrice: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-outline-variant text-body-sm mt-1" />
          </div>
          <div>
            <label className="text-label-sm text-on-surface-variant">Auto-accept above</label>
            <input type="number" value={rule.autoAcceptThreshold} onChange={(e) => setRule({ ...rule, autoAcceptThreshold: e.target.value })} placeholder="Optional" className="w-full h-9 px-3 rounded-lg border border-outline-variant text-body-sm mt-1" />
          </div>
          <div>
            <label className="text-label-sm text-on-surface-variant">Max rounds</label>
            <input type="number" min="1" value={rule.maxRounds} onChange={(e) => setRule({ ...rule, maxRounds: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-outline-variant text-body-sm mt-1" />
          </div>
        </div>
      )}

      <button onClick={save} disabled={saving} className="h-10 px-4 rounded-lg bg-primary text-on-primary text-label-md font-medium disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Rule'}
      </button>
    </div>
  );
}

function OfferRow({ offer, onToast, onUpdated }) {
  const [countering, setCountering] = useState(false);
  const [counterPrice, setCounterPrice] = useState(offer.offered_price);
  const [busy, setBusy] = useState(false);
  const actionable = offer.status === 'pending' && offer.offered_by === 'buyer';

  const respond = async (action, extra = {}) => {
    setBusy(true);
    try {
      await respondToOffer(offer.id, action, extra);
      onToast?.(`Offer ${action}ed`);
      onUpdated();
    } catch (err) {
      onToast?.(err.message || 'Could not respond', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-label-md text-on-surface font-semibold">{offer.product_name}</p>
          <p className="text-label-sm text-on-surface-variant">Buyer #{offer.buyer_id} · Round {offer.round}</p>
        </div>
        <div className="text-right">
          <p className="text-title-md text-primary font-bold">${offer.offered_price.toLocaleString()}</p>
          <p className="text-label-sm text-on-surface-variant capitalize">{offer.status}</p>
        </div>
      </div>
      {offer.message && <p className="text-label-sm text-on-surface-variant mt-2 italic">"{offer.message}"</p>}

      {actionable && (
        countering ? (
          <div className="flex items-center gap-2 mt-3">
            <input type="number" value={counterPrice} onChange={(e) => setCounterPrice(e.target.value)} className="flex-1 h-9 px-3 rounded-lg border border-outline-variant text-body-sm" />
            <button onClick={() => respond('counter', { counterPrice: Number(counterPrice) })} disabled={busy} className="h-9 px-3 rounded-lg bg-primary text-on-primary text-label-sm font-medium disabled:opacity-50">
              Send
            </button>
            <button onClick={() => setCountering(false)} className="h-9 px-3 rounded-lg border border-outline-variant text-label-sm">Cancel</button>
          </div>
        ) : (
          <div className="flex gap-2 mt-3">
            <button onClick={() => respond('accept')} disabled={busy} className="flex-1 h-9 rounded-lg bg-primary text-on-primary text-label-sm font-medium disabled:opacity-50">Accept</button>
            <button onClick={() => setCountering(true)} disabled={busy} className="flex-1 h-9 rounded-lg border border-outline-variant text-on-surface text-label-sm font-medium">Counter</button>
            <button onClick={() => respond('reject')} disabled={busy} className="flex-1 h-9 rounded-lg border border-outline-variant text-on-surface-variant text-label-sm font-medium">Reject</button>
          </div>
        )
      )}
    </div>
  );
}

export default function SellerNegotiationTab({ products = [], onToast }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await listMyOffers();
    setOffers(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const pending = offers.filter((o) => o.status === 'pending' && o.offered_by === 'buyer');
  const others = offers.filter((o) => !(o.status === 'pending' && o.offered_by === 'buyer'));

  return (
    <div className="space-y-5">
      <h1 className="text-headline-lg text-on-surface font-bold">Negotiation</h1>

      {products.length > 0 && <RuleEditor products={products} onToast={onToast} />}

      <div>
        <h2 className="text-title-sm text-on-surface font-semibold mb-2">
          Needs Your Response {pending.length > 0 && `(${pending.length})`}
        </h2>
        {loading ? (
          <div className="flex justify-center py-10">
            <span className="material-symbols-outlined animate-pulse text-[32px] text-on-surface-variant">sync</span>
          </div>
        ) : pending.length === 0 ? (
          <p className="text-label-md text-on-surface-variant py-4">No pending offers.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((o) => <OfferRow key={o.id} offer={o} onToast={onToast} onUpdated={load} />)}
          </div>
        )}
      </div>

      {others.length > 0 && (
        <div>
          <h2 className="text-title-sm text-on-surface font-semibold mb-2">History</h2>
          <div className="space-y-3">
            {others.map((o) => <OfferRow key={o.id} offer={o} onToast={onToast} onUpdated={load} />)}
          </div>
        </div>
      )}
    </div>
  );
}
