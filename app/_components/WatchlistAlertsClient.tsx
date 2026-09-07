"use client";

import Link from "next/link";
import { FormEvent, useId, useMemo, useState } from "react";
import { Bookmark, ChevronDown, Edit3, ExternalLink, Save, Search, Trash2 } from "lucide-react";
import { bonds } from "../../lib/bonds";
import { cryptoAssets } from "../../lib/crypto";
import { currencyPairs } from "../../lib/currencies";
import { indianStocks } from "../../lib/indian-stocks";
import { insuranceProviders } from "../../lib/insurance";
import { metals } from "../../lib/metals";
import { mutualFunds } from "../../lib/mutual-funds";
import type { AssetType, WatchlistItem } from "../../lib/storage";

import { accountRequest, invalidateAccountData, useAccountResource } from "../_hooks/useAccountResource";

export type AssetActionDescriptor = {
  assetKey: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  route?: string;
  market?: string;
};


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
      <input aria-expanded={open} aria-controls={resultsId} aria-label="Search assets" aria-autocomplete="list" role="combobox" value={query} onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }} onFocus={() => setOpen(true)} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} placeholder={selected ? `${selected.symbol} · ${selected.name}` : "Search by symbol or asset name"} />
      <button type="button" aria-label={open ? "Close asset results" : "Open asset results"} onClick={() => setOpen((value) => !value)}><ChevronDown size={16} /></button>
    </div>
    {open ? <div id={resultsId} className="asset-picker-menu" role="listbox" aria-label="Matching assets">
      {filtered.length ? filtered.map((asset) => <button type="button" role="option" aria-selected={asset.assetKey === value} className={asset.assetKey === value ? "active" : ""} key={asset.assetKey} onClick={() => { onSelect(asset); setQuery(""); setOpen(false); }}><span className="asset-picker-mark">{asset.symbol.slice(0, 2)}</span><span><strong>{asset.name}</strong><small>{asset.symbol} · {asset.assetType}{asset.market ? ` · ${asset.market}` : ""}</small></span></button>) : <p className="asset-picker-empty">No supported assets match your search.</p>}
    </div> : null}
    {selected ? <div className="asset-picker-selected"><strong>{selected.name}</strong><small>{selected.symbol} · {selected.assetType}{selected.market ? ` · ${selected.market}` : ""}</small></div> : <small className="asset-picker-hint">Search the supported assets.</small>}
  </div>;
}


export function AssetActionButtons({ asset, compact = false }: { asset: AssetActionDescriptor; compact?: boolean; showAlert?: boolean }) {
  const state = useAccountResource<WatchlistItem[]>("/api/storage/watchlist");
  const item = state.data?.find((candidate) => candidate.assetKey === asset.assetKey && (candidate.market || "") === (asset.market || ""));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function toggle() {
    setBusy(true); setMessage("");
    try {
      await accountRequest(item ? `/api/storage/watchlist?id=${encodeURIComponent(item.id)}` : "/api/storage/watchlist", {
        method: item ? "DELETE" : "POST", headers: { "content-type": "application/json" }, body: item ? undefined : JSON.stringify(asset),
      });
      invalidateAccountData();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to update watchlist."); }
    finally { setBusy(false); }
  }
  return <div className={compact ? "asset-actions compact" : "asset-actions"}>
    {state.unauthorized ? <Link className="outline-button" href="/login">Sign in to watch</Link> : <button className="outline-button" disabled={busy || state.loading || Boolean(state.error)} onClick={() => void toggle()} type="button" aria-pressed={Boolean(item)} aria-label={`${item ? "Remove" : "Watch"} ${asset.name}`}><Bookmark size={15} fill={item ? "currentColor" : "none"} />{item ? "Watching" : "Watch"}</button>}
    {message || state.error && !state.unauthorized ? <small role="status">{message || state.error}</small> : null}
  </div>;
}

export function WatchlistManager() {
  const account = useAccountResource<{ user: { id: string } | null }>("/api/auth/me");
  return <PersonalWatchlist key={account.data?.user?.id || "signed-out"} />;
}
function PersonalWatchlist() {
  const state = useAccountResource<WatchlistItem[]>("/api/storage/watchlist");
  const [asset, setAsset] = useState<AssetActionDescriptor | null>(null);
  const [editing, setEditing] = useState<WatchlistItem | null>(null);
  const [notes, setNotes] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const items = state.data || [];
  const visible = items.filter((item) => (filter === "all" || item.assetType === filter) && `${item.name} ${item.symbol} ${item.market || ""}`.toLowerCase().includes(query.toLowerCase()));
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!editing && !asset) return;
    setBusy(true); setMessage("");
    try {
      await accountRequest("/api/storage/watchlist", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...(editing || asset), notes }) });
      setAsset(null); setEditing(null); setNotes(""); invalidateAccountData();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save."); }
    finally { setBusy(false); }
  }
  async function remove(item: WatchlistItem) {
    if (!window.confirm(`Remove ${item.name} from your watchlist?`)) return;
    setBusy(true);
    try {
      await accountRequest(`/api/storage/watchlist?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
      if (editing?.id === item.id) { setEditing(null); setNotes(""); }
      invalidateAccountData();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to remove."); }
    finally { setBusy(false); }
  }
  if (state.unauthorized) return <section className="glass-panel form-panel"><h2>Your personal watchlist</h2><p>Sign in to save assets privately across devices. Guest data is not automatically imported.</p><Link className="primary-button" href="/login">Sign in</Link></section>;
  return <div className="watchlist-manager">
    <section className="glass-panel form-panel">
      <h2>{editing ? "Edit your note" : "Build your watchlist"}</h2>
      <p>Saving an asset does not enable notifications. <Link href="/notifications">Manage the two fixed market updates separately.</Link></p>
      <form className="finance-form" onSubmit={save}>
        {editing ? <p>{editing.name} · {editing.market}</p> : <div className="full"><SearchableAssetSelect value={asset?.assetKey || ""} onSelect={setAsset} /></div>}
        <label className="full"><span>Personal note (optional)</span><textarea maxLength={500} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
        <div className="form-actions full"><button className="primary-button" disabled={busy || state.loading || Boolean(state.error) || !asset && !editing}><Save size={16} />{busy ? "Saving..." : editing ? "Save note" : "Add to watchlist"}</button>{editing ? <button type="button" className="outline-button" onClick={() => { setEditing(null); setNotes(""); }}>Cancel</button> : null}</div>
      </form>
      {message ? <p role="status">{message}</p> : null}
    </section>
    <section className="glass-panel watchlist-list-panel">
      <h2>Saved assets ({items.length})</h2>
      <div className="form-actions"><input type="search" aria-label="Search your watchlist" placeholder="Search saved assets" value={query} onChange={(event) => setQuery(event.target.value)} /><select aria-label="Filter asset type" value={filter} onChange={(event) => setFilter(event.target.value)}>{["all", "metal", "stock", "crypto", "fund", "bond", "currency", "other"].map((type) => <option key={type}>{type}</option>)}</select></div>
      {state.loading ? <p role="status">Loading your watchlist...</p> : state.error ? <p role="alert">{state.error} <button onClick={() => void state.refresh()}>Retry</button></p> : !visible.length ? <p>{items.length ? "No saved assets match this filter." : "Your watchlist is empty."}</p> : <div className="saved-asset-list">{visible.map((item) => <article className="saved-asset-row" key={item.id}>
        <span className="asset-badge">{item.symbol.slice(0, 2)}</span><div><strong>{item.name}</strong><small>{item.symbol} · {item.assetType} · {item.market}</small>{item.notes ? <p>{item.notes}</p> : null}</div>
        <div className="saved-asset-actions">{item.route ? <Link className="icon-action" href={item.route} aria-label={`Research ${item.name}`}><ExternalLink size={16} /></Link> : null}<button disabled={busy} className="icon-action" aria-label={`Edit note for ${item.name}`} onClick={() => { setEditing(item); setNotes(item.notes || ""); }}><Edit3 size={16} /></button><button disabled={busy} className="icon-action" aria-label={`Remove ${item.name}`} onClick={() => void remove(item)}><Trash2 size={16} /></button></div>
      </article>)}</div>}
    </section>
  </div>;
}
