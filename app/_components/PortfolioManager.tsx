"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Edit3, History, RefreshCw, Trash2, Wallet, X } from "lucide-react";
import type { PortfolioTransaction } from "../../lib/storage";

type Position = { assetKey: string; symbol: string; name: string | null; assetType: string; quantity: number; costBasis: number; averagePrice: number; realizedProfitLoss: number; currency: string };
type Summary = { costBasis: number; realizedProfitLoss: number; cashFlow: number; transactionCount: number; positions: Position[]; updatedAt: number };
type Form = { assetKey: string; symbol: string; name: string; assetType: string; side: PortfolioTransaction["side"]; quantity: string; price: string; fees: string; currency: string; transactionDate: string; notes: string };

const initialForm: Form = { assetKey: "", symbol: "", name: "", assetType: "stock", side: "buy", quantity: "", price: "", fees: "0", currency: "INR", transactionDate: new Date().toISOString().slice(0, 10), notes: "" };

function formatMoney(value: number, currency = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  }
}

function formFromTransaction(transaction: PortfolioTransaction): Form {
  return { assetKey: transaction.assetKey || "", symbol: transaction.symbol, name: transaction.name || "", assetType: transaction.assetType, side: transaction.side, quantity: String(transaction.quantity), price: String(transaction.price), fees: String(transaction.fees), currency: transaction.currency, transactionDate: transaction.transactionDate, notes: transaction.notes || "" };
}

export default function PortfolioManager() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<PortfolioTransaction[]>([]);
  const [form, setForm] = useState<Form>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function readJson<T>(response: Response) {
    const payload = await response.json() as { ok?: boolean; data?: T; error?: string };
    if (!response.ok || payload.ok === false) throw new Error(payload.error || "Portfolio storage is unavailable.");
    return payload.data as T;
  }

  const load = useCallback(async function loadPortfolio() {
    setLoading(true);
    try {
      const [summaryResponse, transactionsResponse] = await Promise.all([fetch("/api/storage/portfolio/summary", { cache: "no-store" }), fetch("/api/storage/transactions", { cache: "no-store" })]);
      const [nextSummary, nextTransactions] = await Promise.all([readJson<Summary>(summaryResponse), readJson<PortfolioTransaction[]>(transactionsResponse)]);
      setSummary(nextSummary);
      setTransactions(nextTransactions);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Portfolio storage is unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function resetForm() {
    setForm({ ...initialForm, transactionDate: new Date().toISOString().slice(0, 10) });
    setEditingId(null);
  }

  function editTransaction(transaction: PortfolioTransaction) {
    setForm(formFromTransaction(transaction));
    setEditingId(transaction.id);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const currentEditingId = editingId;
    try {
      const payload = { ...form, quantity: Number(form.quantity), price: Number(form.price), fees: Number(form.fees) };
      const endpoint = currentEditingId ? `/api/storage/transactions/${encodeURIComponent(currentEditingId)}` : "/api/storage/transactions";
      const response = await fetch(endpoint, { method: currentEditingId ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      await readJson<PortfolioTransaction>(response);
      resetForm();
      await load();
      setMessage(currentEditingId ? "Transaction updated." : "Transaction saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save transaction.");
    } finally {
      setSaving(false);
    }
  }

  async function removeTransaction(transaction: PortfolioTransaction) {
    if (!window.confirm(`Delete the ${transaction.symbol} transaction from ${transaction.transactionDate}?`)) return;
    try {
      const response = await fetch(`/api/storage/transactions/${encodeURIComponent(transaction.id)}`, { method: "DELETE" });
      await readJson<{ deleted: boolean }>(response);
      if (editingId === transaction.id) resetForm();
      await load();
      setMessage("Transaction deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete transaction.");
    }
  }

  return <div className="portfolio-module">
    <section className="portfolio-hero glass-panel"><div><span className="finance-eyebrow">Persistent portfolio</span><h2>Track your own transactions and cost basis.</h2><p>Values below come from your stored transactions. Current valuation is added only when a live provider quote is available.</p></div><button className="outline-button" type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={15} />Refresh</button></section>
    {message ? <p className="portfolio-message" role="status">{message}</p> : null}
    <div className="portfolio-grid">
      <section className="glass-panel portfolio-form-panel"><div className="panel-head"><div><span className="finance-eyebrow">{editingId ? "Edit transaction" : "Add transaction"}</span><h2>{editingId ? "Update a stored transaction" : "Record a real holding"}</h2></div>{editingId ? <button className="icon-action" type="button" onClick={resetForm} aria-label="Cancel transaction edit"><X size={17} /></button> : <Wallet size={20} />}</div><form onSubmit={submit} className="portfolio-form"><label>Symbol<input required value={form.symbol} onChange={(event) => setForm({ ...form, symbol: event.target.value })} placeholder="RELIANCE" /></label><label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Reliance Industries" /></label><label>Asset type<select value={form.assetType} onChange={(event) => setForm({ ...form, assetType: event.target.value })}><option value="stock">Stock</option><option value="crypto">Crypto</option><option value="metal">Metal</option><option value="fund">Mutual fund</option><option value="bond">Bond</option><option value="currency">Currency</option><option value="other">Other</option></select></label><label>Side<select value={form.side} onChange={(event) => setForm({ ...form, side: event.target.value as Form["side"] })}><option value="buy">Buy</option><option value="sell">Sell</option><option value="dividend">Dividend</option><option value="fee">Fee</option><option value="deposit">Deposit</option><option value="withdrawal">Withdrawal</option></select></label><label>Quantity<input required type="number" min="0" step="any" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} /></label><label>Price per unit<input required type="number" min="0" step="any" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label><label>Fees<input type="number" min="0" step="any" value={form.fees} onChange={(event) => setForm({ ...form, fees: event.target.value })} /></label><label>Currency<input required maxLength={8} value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase() })} /></label><label>Date<input required type="date" value={form.transactionDate} onChange={(event) => setForm({ ...form, transactionDate: event.target.value })} /></label><label className="portfolio-notes-field">Notes<textarea maxLength={1000} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Optional broker or tax note" /></label><div className="form-actions"><button className="primary-button" type="submit" disabled={saving}>{saving ? "Saving..." : editingId ? "Save changes" : "Save transaction"}<ArrowRight size={15} /></button>{editingId ? <button className="outline-button" type="button" onClick={resetForm}>Cancel</button> : null}</div></form></section>
      <aside className="glass-panel portfolio-summary-panel"><Wallet size={20} /><span className="finance-eyebrow">Stored summary</span><strong>{summary ? formatMoney(summary.costBasis) : "Unavailable"}</strong><small>Cost basis</small><div><b>{summary?.transactionCount ?? 0}</b><span>Transactions</span></div><div><b>{formatMoney(summary?.realizedProfitLoss ?? 0)}</b><span>Realized P&amp;L</span></div><Link className="outline-button" href="/watchlist">Open watchlist</Link></aside>
    </div>
    <section className="glass-panel portfolio-positions"><div className="finance-eyebrow">Positions</div><h2>Stored holdings</h2>{loading ? <p>Loading persistent storage...</p> : summary?.positions.length ? summary.positions.map((position) => <div className="portfolio-position" key={position.assetKey}><span><b>{position.name || position.symbol}</b><small>{position.symbol} · {position.assetType}</small></span><span><b>{position.quantity}</b><small>Quantity · Avg {formatMoney(position.averagePrice, position.currency)}</small></span><span><b>{formatMoney(position.costBasis, position.currency)}</b><small>Cost basis</small></span></div>) : <p>No stored positions yet. Add a transaction above.</p>}</section>
    <section className="glass-panel portfolio-history"><div className="panel-head"><div><span className="finance-eyebrow">Transaction history</span><h2>Review and manage every entry</h2></div><History size={18} /></div>{loading ? <p>Loading transactions...</p> : transactions.length ? <div className="portfolio-transaction-list">{transactions.map((transaction) => <article className="portfolio-transaction" key={transaction.id}><div><strong>{transaction.symbol}</strong><small>{transaction.name || transaction.assetType} · {transaction.transactionDate} · {transaction.side}</small></div><div><b>{transaction.quantity.toLocaleString("en-IN")} × {formatMoney(transaction.price, transaction.currency)}</b><small>Fees {formatMoney(transaction.fees, transaction.currency)}</small></div><div className="saved-asset-actions"><button className="icon-action" type="button" onClick={() => editTransaction(transaction)} aria-label={`Edit ${transaction.symbol} transaction`}><Edit3 size={15} /></button><button className="icon-action danger" type="button" onClick={() => void removeTransaction(transaction)} aria-label={`Delete ${transaction.symbol} transaction`}><Trash2 size={15} /></button></div></article>)}</div> : <p>No transactions have been recorded yet.</p>}</section>
  </div>;
}
