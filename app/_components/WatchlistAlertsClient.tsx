"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useId, useMemo, useState } from "react";
import { Bell, Bookmark, Check, ChevronDown, Edit3, ExternalLink, Plus, Save, Search, Trash2, X } from "lucide-react";
import { bonds } from "../../lib/bonds";
import { cryptoAssets } from "../../lib/crypto";
import { currencyPairs } from "../../lib/currencies";
import { indianStocks } from "../../lib/indian-stocks";
import { insuranceProviders } from "../../lib/insurance";
import { metals } from "../../lib/metals";
import { mutualFunds } from "../../lib/mutual-funds";
import type { AlertDirection, AssetType, UserAlert, WatchlistItem } from "../../lib/storage";

type ApiResponse<T> = { ok?: boolean; data?: T; error?: string };

export type AssetActionDescriptor = {
  assetKey: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  route?: string;
  market?: string;
};

const assetTypes: AssetType[] = ["metal", "stock", "crypto", "fund", "bond", "currency", "other"];

const assetCatalog: AssetActionDescriptor[] = [
  ...metals.map((item) => ({ assetKey: item.key, symbol: item.symbol, name: item.name, assetType: "metal" as const, route: item.route, market: "India metals" })),
  ...indianStocks.map((item) => ({ assetKey: `stock:${item.slug}`, symbol: item.symbol, name: item.name, assetType: "stock" as const, route: `/stocks/${item.slug}`, market: item.exchange })),
  ...cryptoAssets.map((item) => ({ assetKey: `crypto:${item.slug}`, symbol: item.symbol, name: item.name, assetType: "crypto" as const, route: `/crypto/${item.slug}`, market: "Crypto" })),
  ...mutualFunds.map((item) => ({ assetKey: `fund:${item.slug}`, symbol: item.slug, name: item.name, assetType: "fund" as const, route: `/mutual-funds/${item.slug}`, market: item.amc })),
  ...bonds.map((item) => ({ assetKey: `bond:${item.slug}`, symbol: item.slug, name: item.name, assetType: "bond" as const, route: `/bonds/${item.slug}`, market: item.issuer })),
  ...insuranceProviders.map((item) => ({ assetKey: `insurance:${item.slug}`, symbol: item.slug, name: item.name, assetType: "other" as const, route: `/insurance/providers/${item.slug}`, market: item.type })),
  ...currencyPairs.map((item) => ({ assetKey: `currency:${item.slug}`, symbol: item.symbol, name: item.name, assetType: "currency" as const, route: `/currencies/${item.slug}`, market: item.market })),
];

function SearchableAssetSelect({ value, current, onSelect }: { value: string; current?: AssetActionDescriptor; onSelect: (asset: AssetActionDescriptor) => void }) {
  const resultsId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const options = useMemo(() => current && !assetCatalog.some((asset) => asset.assetKey === current.assetKey) ? [current, ...assetCatalog] : assetCatalog, [current]);
  const selected = options.find((asset) => asset.assetKey === value);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return options.filter((asset) => !normalized || `${asset.symbol} ${asset.name} ${asset.assetType} ${asset.market || ""}`.toLowerCase().includes(normalized)).slice(0, 14);
  }, [options, query]);

  return <div className="asset-picker">
    <div className="asset-picker-input">
      <Search size={16} aria-hidden="true" />
      <input aria-expanded={open} aria-controls={resultsId} aria-label="Search assets" aria-autocomplete="list" role="combobox" value={query} onFocus={() => setOpen(true)} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} placeholder={selected ? `${selected.symbol} · ${selected.name}` : "Search by symbol or asset name"} />
      <button type="button" aria-label={open ? "Close asset results" : "Open asset results"} onClick={() => setOpen((value) => !value)}><ChevronDown size={16} /></button>
    </div>
    {open ? <div id={resultsId} className="asset-picker-menu" role="listbox" aria-label="Matching assets">
      {filtered.length ? filtered.map((asset) => <button type="button" role="option" aria-selected={asset.assetKey === value} className={asset.assetKey === value ? "active" : ""} key={asset.assetKey} onClick={() => { onSelect(asset); setQuery(""); setOpen(false); }}><span className="asset-picker-mark">{asset.symbol.slice(0, 2)}</span><span><strong>{asset.name}</strong><small>{asset.symbol} · {asset.assetType}{asset.market ? ` · ${asset.market}` : ""}</small></span></button>) : <p className="asset-picker-empty">No matching assets. Use manual entry below.</p>}
    </div> : null}
    {selected ? <div className="asset-picker-selected"><strong>{selected.name}</strong><small>{selected.symbol} · {selected.assetType}{selected.market ? ` · ${selected.market}` : ""}</small></div> : <small className="asset-picker-hint">Search the supported assets or enter one manually.</small>}
  </div>;
}

function formAsset(form: { assetKey: string; symbol: string; name: string; assetType: AssetType; route?: string; market?: string }) {
  return { assetKey: form.assetKey, symbol: form.symbol, name: form.name, assetType: form.assetType, route: form.route || "", market: form.market || "" } satisfies AssetActionDescriptor;
}

async function readApi<T>(response: Response) {
  const payload = (await response.json().catch(() => ({}))) as ApiResponse<T>;
  if (!response.ok || payload.ok === false) throw new Error(payload.error || "Storage operation failed.");
  return payload.data as T;
}

export function AssetActionButtons({ asset, compact = false, showAlert = true }: { asset: AssetActionDescriptor; compact?: boolean; showAlert?: boolean }) {
  const router = useRouter();
  const [item, setItem] = useState<WatchlistItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/storage/watchlist", { cache: "no-store" })
      .then((response) => readApi<WatchlistItem[]>(response))
      .then((items) => {
        if (!active) return;
        setItem(items.find((candidate) => candidate.assetKey === asset.assetKey || candidate.symbol === asset.symbol) || null);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [asset.assetKey, asset.symbol]);

  async function toggleWatchlist() {
    setBusy(true);
    setMessage("");
    try {
      if (item) {
        await readApi(await fetch(`/api/storage/watchlist?id=${encodeURIComponent(item.id)}`, { method: "DELETE" }));
        setItem(null);
        setMessage("Removed from watchlist.");
      } else {
        const saved = await readApi<WatchlistItem>(await fetch("/api/storage/watchlist", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(asset) }));
        setItem(saved);
        setMessage("Added to watchlist.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update watchlist.");
    } finally {
      setBusy(false);
    }
  }

  function openAlert() {
    const params = new URLSearchParams({ asset: asset.assetKey, symbol: asset.symbol, name: asset.name, type: asset.assetType, route: asset.route || "", market: asset.market || "" });
    router.push(`/alerts?${params.toString()}`);
  }

  return <div className={compact ? "asset-actions compact" : "asset-actions"}>
    <button className="outline-button" disabled={busy} onClick={() => void toggleWatchlist()} type="button" aria-label={`${item ? "Remove" : "Add"} ${asset.symbol} ${item ? "from" : "to"} watchlist`}><Bookmark size={15} fill={item ? "currentColor" : "none"} />{item ? "Watching" : "Watch"}</button>
    {showAlert ? <button className="outline-button" onClick={openAlert} type="button" aria-label={`Set alert for ${asset.symbol}`}><Bell size={15} />Alert</button> : null}
    {message ? <small role="status">{message}</small> : null}
  </div>;
}

const emptyWatchlistForm = { id: "", assetKey: "", symbol: "", name: "", assetType: "other" as AssetType, route: "", market: "" };

export function WatchlistManager() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [form, setForm] = useState(emptyWatchlistForm);
  const [manualMode, setManualMode] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try { setItems(await readApi<WatchlistItem[]>(await fetch("/api/storage/watchlist", { cache: "no-store" }))); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not load watchlist."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  function updateField(field: keyof typeof emptyWatchlistForm, value: string) {
    setForm((current) => ({ ...current, [field]: field === "assetType" ? value as AssetType : value }));
  }

  function selectAsset(asset: AssetActionDescriptor) {
    setForm((current) => ({ ...current, ...asset }));
    setManualMode(false);
  }

  function edit(item: WatchlistItem) {
    setForm({ id: item.id, assetKey: item.assetKey, symbol: item.symbol, name: item.name, assetType: item.assetType, route: item.route || "", market: item.market || "" });
    setManualMode(!assetCatalog.some((asset) => asset.assetKey === item.assetKey));
    setEditing(true);
    setMessage("");
  }

  function reset() { setForm(emptyWatchlistForm); setManualMode(false); setEditing(false); setMessage(""); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await readApi<WatchlistItem>(await fetch("/api/storage/watchlist", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) }));
      reset();
      await load();
      setMessage(editing ? "Watchlist item updated." : "Added to watchlist.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save watchlist item."); }
    finally { setBusy(false); }
  }

  async function remove(item: WatchlistItem) {
    if (!window.confirm(`Remove ${item.name} from your watchlist?`)) return;
    try {
      await readApi(await fetch(`/api/storage/watchlist?id=${encodeURIComponent(item.id)}`, { method: "DELETE" }));
      setItems((current) => current.filter((candidate) => candidate.id !== item.id));
      if (form.id === item.id) reset();
      setMessage(`${item.name} removed from watchlist.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not remove watchlist item."); }
  }

  return <div className="watchlist-manager">
    <section className="glass-panel form-panel watchlist-editor">
      <div className="panel-head"><div><span className="finance-eyebrow">{editing ? "Edit saved asset" : "Add an asset"}</span><h2>{editing ? "Update watchlist item" : "Build your watchlist"}</h2></div>{editing ? <button className="icon-action" onClick={reset} type="button" aria-label="Cancel edit"><X size={17} /></button> : <Plus size={18} />}</div>
      <p className="watchlist-help">Use the asset buttons inside Metals, Stocks, Crypto, Mutual Funds, Bonds, Insurance and Currencies, or add a symbol manually here.</p>
      <form className="finance-form watchlist-form" onSubmit={submit}>
        {!manualMode ? <div className="asset-picker-field full"><div className="asset-picker-heading"><span>Choose an asset</span><button className="text-button" type="button" onClick={() => setManualMode(true)}>Enter manually</button></div><SearchableAssetSelect value={form.assetKey} current={form.assetKey ? formAsset(form) : undefined} onSelect={selectAsset} /></div> : <div className="manual-asset-fields full"><div className="asset-picker-heading"><span>Manual asset details</span><button className="text-button" type="button" onClick={() => setManualMode(false)}>Use asset search</button></div><div className="manual-asset-grid"><label><span>Symbol</span><input required value={form.symbol} onChange={(event) => updateField("symbol", event.target.value)} placeholder="BTC or RELIANCE" /></label><label><span>Asset name</span><input required value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Bitcoin" /></label><label><span>Asset type</span><select value={form.assetType} onChange={(event) => updateField("assetType", event.target.value)}>{assetTypes.map((type) => <option value={type} key={type}>{type}</option>)}</select></label><label><span>Asset key</span><input value={form.assetKey} onChange={(event) => updateField("assetKey", event.target.value)} placeholder="crypto:bitcoin" /></label><label><span>Detail route</span><input value={form.route} onChange={(event) => updateField("route", event.target.value)} placeholder="/crypto/bitcoin" /></label><label><span>Market</span><input value={form.market} onChange={(event) => updateField("market", event.target.value)} placeholder="India / Global" /></label></div></div>}
        <div className="form-actions full"><button className="primary-button" disabled={busy} type="submit"><Save size={16} />{busy ? "Saving..." : editing ? "Save changes" : "Add to watchlist"}</button>{editing ? <button className="outline-button" onClick={reset} type="button">Cancel</button> : null}</div>
      </form>
      {message ? <p className="form-status" role="status">{message}</p> : null}
    </section>
    <section className="glass-panel watchlist-list-panel">
      <div className="panel-head"><div><span className="finance-eyebrow">Saved across modules</span><h2>{items.length} watchlist {items.length === 1 ? "item" : "items"}</h2></div><Bookmark size={18} /></div>
      {loading ? <p role="status">Loading watchlist...</p> : items.length === 0 ? <div className="empty-state"><Bookmark size={25} /><p>Your watchlist is empty.</p><small>Add assets from any module or use the form above.</small></div> : <div className="saved-asset-list">{items.map((item) => <article className="saved-asset-row" key={item.id}><span className="asset-badge">{item.symbol.slice(0, 2)}</span><div><strong>{item.name}</strong><small>{item.symbol} · {item.assetType}{item.market ? ` · ${item.market}` : ""}</small></div><div className="saved-asset-actions">{item.route ? <Link className="icon-action" href={item.route} aria-label={`Open ${item.name}`}><ExternalLink size={15} /></Link> : null}<button className="icon-action" onClick={() => edit(item)} type="button" aria-label={`Edit ${item.name}`}><Edit3 size={15} /></button><button className="icon-action danger" onClick={() => void remove(item)} type="button" aria-label={`Delete ${item.name}`}><Trash2 size={15} /></button></div></article>)}</div>}
    </section>
  </div>;
}

const emptyAlertForm = { id: "", assetKey: "", symbol: "", name: "", assetType: "other" as AssetType, direction: "above" as AlertDirection, targetPrice: "", movementPercent: "", city: "mumbai", currency: "INR", enabled: true, route: "", market: "" };

export function AlertsManager() {
  const params = useSearchParams();
  const [alerts, setAlerts] = useState<UserAlert[]>([]);
  const [form, setForm] = useState(emptyAlertForm);
  const [manualMode, setManualMode] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const assetKey = params.get("asset") || "";
    if (!assetKey) return;
    setForm((current) => ({ ...current, assetKey, symbol: params.get("symbol") || current.symbol, name: params.get("name") || current.name, assetType: (params.get("type") as AssetType) || current.assetType, route: params.get("route") || current.route, market: params.get("market") || current.market }));
    setManualMode(!assetCatalog.some((asset) => asset.assetKey === assetKey));
  }, [params]);

  async function load() {
    setLoading(true);
    try { setAlerts(await readApi<UserAlert[]>(await fetch("/api/storage/alerts", { cache: "no-store" }))); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not load alerts."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  function updateField(field: keyof typeof emptyAlertForm, value: string | boolean) { setForm((current) => ({ ...current, [field]: value })); }
  function selectAsset(asset: AssetActionDescriptor) { setForm((current) => ({ ...current, ...asset })); setManualMode(false); }
  function edit(alert: UserAlert) { setForm({ id: alert.id, assetKey: alert.assetKey, symbol: alert.symbol, name: alert.name || "", assetType: alert.assetType, direction: alert.direction, targetPrice: alert.targetPrice?.toString() || "", movementPercent: alert.movementPercent?.toString() || "", city: alert.city, currency: alert.currency, enabled: alert.enabled, route: "", market: "" }); setManualMode(!assetCatalog.some((asset) => asset.assetKey === alert.assetKey)); setEditing(true); setMessage(""); }
  function reset() { setForm(emptyAlertForm); setManualMode(false); setEditing(false); setMessage(""); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const payload = { ...form, targetPrice: form.direction === "movement" ? null : Number(form.targetPrice), movementPercent: form.direction === "movement" ? Number(form.movementPercent) : null };
      if (editing) await readApi<UserAlert>(await fetch(`/api/storage/alerts/${encodeURIComponent(form.id)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }));
      else await readApi<UserAlert>(await fetch("/api/storage/alerts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }));
      reset();
      await load();
      setMessage(editing ? "Alert updated." : "Alert created.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save alert."); }
    finally { setBusy(false); }
  }

  async function toggle(alert: UserAlert) {
    try {
      const updated = await readApi<UserAlert>(await fetch(`/api/storage/alerts/${encodeURIComponent(alert.id)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ enabled: !alert.enabled }) }));
      setAlerts((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not update alert."); }
  }

  async function remove(alert: UserAlert) {
    if (!window.confirm(`Delete the ${alert.symbol} alert?`)) return;
    try {
      await readApi(await fetch(`/api/storage/alerts/${encodeURIComponent(alert.id)}`, { method: "DELETE" }));
      setAlerts((current) => current.filter((item) => item.id !== alert.id));
      if (form.id === alert.id) reset();
      setMessage(`${alert.symbol} alert deleted.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not delete alert."); }
  }

  const activeCount = useMemo(() => alerts.filter((alert) => alert.enabled).length, [alerts]);

  return <div className="alerts-manager">
    <section className="glass-panel form-panel alert-editor">
      <div className="panel-head"><div><span className="finance-eyebrow">{editing ? "Edit alert" : "Create alert"}</span><h2>{editing ? "Update notification rule" : "Set a price or movement alert"}</h2></div><Bell size={18} /></div>
      <p className="watchlist-help">Alerts can be created for metals, Indian stocks, crypto, mutual funds, bonds, insurance research items and currencies.</p>
      <form className="finance-form alert-form-grid" onSubmit={submit}>
        {!manualMode ? <div className="asset-picker-field full"><div className="asset-picker-heading"><span>Choose an asset</span><button className="text-button" type="button" onClick={() => setManualMode(true)}>Enter manually</button></div><SearchableAssetSelect value={form.assetKey} current={form.assetKey ? formAsset(form) : undefined} onSelect={selectAsset} /></div> : <div className="manual-asset-fields full"><div className="asset-picker-heading"><span>Manual asset details</span><button className="text-button" type="button" onClick={() => setManualMode(false)}>Use asset search</button></div><div className="manual-asset-grid"><label><span>Symbol</span><input required value={form.symbol} onChange={(event) => updateField("symbol", event.target.value)} placeholder="GOLD or BTC" /></label><label><span>Asset name</span><input value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Gold" /></label><label><span>Asset key</span><input required value={form.assetKey} onChange={(event) => updateField("assetKey", event.target.value)} placeholder="metal:gold" /></label><label><span>Asset type</span><select value={form.assetType} onChange={(event) => updateField("assetType", event.target.value)}>{assetTypes.map((type) => <option value={type} key={type}>{type}</option>)}</select></label></div></div>}
        <label><span>Condition</span><select value={form.direction} onChange={(event) => updateField("direction", event.target.value)}><option value="above">Price above</option><option value="below">Price below</option><option value="movement">Movement percentage</option></select></label>
        {form.direction === "movement" ? <label><span>Movement %</span><input required min="0.01" step="0.01" type="number" value={form.movementPercent} onChange={(event) => updateField("movementPercent", event.target.value)} placeholder="3" /></label> : <label><span>Target price</span><input required min="0.01" step="0.01" type="number" value={form.targetPrice} onChange={(event) => updateField("targetPrice", event.target.value)} placeholder="2400" /></label>}
        <label><span>City</span><input value={form.city} onChange={(event) => updateField("city", event.target.value)} /></label>
        <label><span>Currency</span><input value={form.currency} onChange={(event) => updateField("currency", event.target.value)} /></label>
        <label className="checkbox-label full"><input checked={form.enabled} onChange={(event) => updateField("enabled", event.target.checked)} type="checkbox" />Enable this alert</label>
        <div className="form-actions full"><button className="primary-button" disabled={busy} type="submit"><Save size={16} />{busy ? "Saving..." : editing ? "Save changes" : "Create alert"}</button>{editing ? <button className="outline-button" onClick={reset} type="button">Cancel</button> : null}</div>
      </form>
      {message ? <p className="form-status" role="status">{message}</p> : null}
    </section>
    <section className="glass-panel alerts-list-panel">
      <div className="panel-head"><div><span className="finance-eyebrow">Rules and status</span><h2>{activeCount} active · {alerts.length} total</h2></div><Check size={18} /></div>
      {loading ? <p role="status">Loading alerts...</p> : alerts.length === 0 ? <div className="empty-state"><Bell size={25} /><p>No alerts yet.</p><small>Set one from an asset page or create one above.</small></div> : <div className="saved-alert-list">{alerts.map((alert) => <article className={`saved-alert-row ${alert.enabled ? "" : "disabled"}`} key={alert.id}><span className="alert-status-icon"><Bell size={16} /></span><div><strong>{alert.name || alert.symbol}</strong><small>{alert.symbol} · {alert.direction === "movement" ? `${alert.movementPercent}% movement` : `${alert.direction} ${alert.currency} ${alert.targetPrice}`}</small></div><label className="alert-toggle"><input checked={alert.enabled} onChange={() => void toggle(alert)} type="checkbox" /><span>{alert.enabled ? "On" : "Off"}</span></label><div className="saved-asset-actions"><button className="icon-action" onClick={() => edit(alert)} type="button" aria-label={`Edit ${alert.symbol} alert`}><Edit3 size={15} /></button><button className="icon-action danger" onClick={() => void remove(alert)} type="button" aria-label={`Delete ${alert.symbol} alert`}><Trash2 size={15} /></button></div></article>)}</div>}
    </section>
  </div>;
}
