"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { calculateMetalTool, initialToolInputs, metalTools, safeCsvCell, validateSavedInputs, type ToolResult } from "../../lib/metals-calculators";
import { accountRequest, invalidateAccountData, useAccountResource } from "../_hooks/useAccountResource";
type Saved = { id: string; calculatorType: string; inputs: Record<string, string>; name: string };
const LOCAL_KEY = "gsp-metals-estimates-v1";
const format = (value: number) => value.toLocaleString("en-IN", { maximumFractionDigits: 6 });
export default function MetalsCalculatorWorkspace({ kind }: { kind: string }) {
  const tool = metalTools[kind];
  const [inputs, setInputs] = useState(() => initialToolInputs(kind));
  const [result, setResult] = useState<ToolResult | null>(null);
  const [message, setMessage] = useState(""); const [error, setError] = useState("");
  const [guestSaved, setGuestSaved] = useState<Saved[]>([]); const [busy, setBusy] = useState(false);
  const [provenance, setProvenance] = useState("Manual input; no market price prefilled.");
  const auth = useAccountResource<{ user: { id: string } | null }>("/api/auth/me");
  const presets = useAccountResource<Saved[]>("/api/storage/calculator-presets");
  const user = auth.data?.user;
  useEffect(() => { try { const parsed = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{"version":1,"items":[]}'); if (parsed.version !== 1 || !Array.isArray(parsed.items)) throw new Error(); setGuestSaved(parsed.items.filter((x: Saved) => x && typeof x.id === "string" && Object.hasOwn(metalTools, x.calculatorType)).slice(0, 20)); } catch { setMessage("Local storage is unavailable or invalid. Calculation and printing still work."); } }, []);
  const saved = (user ? presets.data || [] : guestSaved).filter(x => x.calculatorType === kind);
  function change(key: string, value: string) { setInputs(current => ({ ...current, [key]: value })); setResult(null); setError(""); if (key === "rate") setProvenance("Manual rate edited by you."); }
  function calculate() { try { const value = calculateMetalTool(kind, inputs); setResult(value); setError(""); return value; } catch (e) { setResult(null); setError((e as Error).message); return null; } }
  async function save() {
    if (!calculate() || auth.loading || auth.error) return; setBusy(true);
    try { if (user) { await accountRequest("/api/storage/calculator-presets", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: tool.title, calculatorType: kind, inputs }) }); invalidateAccountData(); }
      else { const next = [{ id: crypto.randomUUID(), name: tool.title, calculatorType: kind, inputs }, ...guestSaved].slice(0, 20); localStorage.setItem(LOCAL_KEY, JSON.stringify({ version: 1, items: next })); setGuestSaved(next); }
      setMessage(user ? "Saved to your account." : "Saved on this device only (maximum 20 estimates). No automatic account merge.");
    } catch (e) { setMessage(`Not saved: ${(e as Error).message}`); } finally { setBusy(false); }
  }
  async function remove(id: string) { try { if (user) { await accountRequest(`/api/storage/calculator-presets/${encodeURIComponent(id)}`, { method: "DELETE" }); invalidateAccountData(); } else { const next = guestSaved.filter(x => x.id !== id); localStorage.setItem(LOCAL_KEY, JSON.stringify({ version: 1, items: next })); setGuestSaved(next); } setMessage("Estimate deleted."); } catch { setMessage("Unable to delete. No changes were saved."); } }
  async function useQuote() {
    setBusy(true); try {
      const metal = ["silver", "platinum", "copper"].includes(kind) ? kind : "gold";
      const response = await fetch(`/api/metals/current?metal=${metal}&country=IN`); const payload = await response.json(); const quote = payload.metal;
      if (!response.ok || quote?.status !== "available" || quote.freshness !== "fresh" || typeof quote.price !== "number") throw new Error("A fresh validated reference quote is not available. Enter your own quotation.");
      setInputs(current => ({ ...current, rate: String(quote.price) })); setResult(null); setProvenance(`Reference input: ${quote.source}; observed ${quote.observedAt || "not supplied"}; ${quote.basis}. Fine-metal reference, not a retailer offer. Adjust to your quoted purity before calculating.`);
    } catch (e) { setMessage((e as Error).message); } finally { setBusy(false); }
  }
  function exportCsv() { const rows = calculate(); if (!rows) return; const csv = [["Calculator", tool.title], ["Basis", "User-entered assumptions, not a quotation"], ...tool.fields.map(f => [f.label, inputs[f.key]]), ...rows.map(r => [r.label, r.value, r.unit])].map(row => row.map(safeCsvCell).join(",")).join("\r\n"); const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })); const a = document.createElement("a"); a.href = url; a.download = `${kind}-estimate.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  return <section className="metals-workspace" aria-label={tool.title}>
    <p>{tool.description}</p><p className="metals-note">No default market price or recommended tax rate. Zero optional charges mean excluded, not legally tax-free. Enter the assumptions on your quotation; all tax results are estimates.</p>
    <div className="metals-calculator-layout"><form onSubmit={event => { event.preventDefault(); calculate(); }} noValidate><div className="metals-fields">{tool.fields.map(f => <label key={f.key}><span>{f.label}</span><input name={f.key} type="number" inputMode="decimal" min="0" step="any" placeholder={f.placeholder} value={inputs[f.key]} onChange={e => change(f.key, e.target.value)} aria-describedby={error ? "metals-input-error" : undefined} /></label>)}</div>
      {tool.fields.some(f => f.key === "rate") ? <><p className="metals-note">{provenance}</p><button type="button" disabled={busy} onClick={useQuote}>Use available fine-metal reference</button></> : null}
      {error ? <p id="metals-input-error" role="alert" className="metals-error">{error}</p> : null}
      <div className="metals-actions"><button className="primary-button" type="submit">Calculate estimate</button><button type="button" onClick={() => { setInputs(initialToolInputs(kind)); setResult(null); setError(""); setProvenance("Manual input; no market price prefilled."); }}>Reset</button></div></form>
      <div className="metals-results" aria-live="polite"><h2>Your estimate</h2>{result ? <dl>{result.map(r => <div key={r.label}><dt>{r.label}</dt><dd>{r.unit === "INR" ? "₹" : ""}{format(r.value)}{r.unit !== "INR" ? ` ${r.unit}` : ""}</dd></div>)}</dl> : <p>Enter your values and calculate. No invented prices or automatic recommendations.</p>}<p className="metals-note">Money rounded to two decimals at output; intermediate calculations retain precision. Other results display up to six decimals.</p></div></div>
    <div className="metals-actions"><button disabled={busy || auth.loading || Boolean(auth.error)} onClick={save}>Save estimate</button><button onClick={() => window.print()}>Print</button><button onClick={exportCsv}>Download CSV</button><button onClick={async () => { try { await navigator.clipboard.writeText(`${location.origin}${location.pathname}`); setMessage("Tool link copied without your private inputs."); } catch { setMessage("Copy the page address to share this tool; no inputs are placed in the URL."); } }}>Copy tool link</button></div>
    {message ? <p role="status">{message}</p> : null}<h2>Saved estimates</h2><p className="metals-note">{user ? "Account-only estimates. Backend failure never falls back to shared storage." : "Local estimates stay on this browser and may be lost if browser data is cleared. Do not use on a shared device."}</p>
    {user && presets.error ? <p role="status">{presets.error}</p> : saved.length ? <ul className="metals-saved">{saved.map((s, i) => <li key={s.id}><span>{tool.title} · {i + 1}</span><button onClick={() => { try { setInputs(validateSavedInputs(kind, s.inputs)); setResult(null); setProvenance("Restored inputs; verify the rate again before using."); } catch { setMessage("Saved estimate is invalid; delete it and create a new one."); } }}>Load</button><button onClick={() => remove(s.id)}>Delete</button></li>)}</ul> : <p>No saved estimates for this tool.</p>}
    <h2>How it works</h2><p>{tool.formula}</p><Link href="/metals/learn/methodology">Read methodology and limitations</Link>
  </section>;
}
