"use client";

import { useEffect, useState } from "react";
import type { NewsCategory, NewsMetal } from "../../lib/news";

export default function NewsPreferencesClient() {
  const [metals, setMetals] = useState<NewsMetal[]>(["gold", "silver"]);
  const [categories, setCategories] = useState<NewsCategory[]>(["metals", "markets", "stocks", "crypto", "funds", "insurance"]);
  const [dailyDigest, setDailyDigest] = useState(false);
  const [breakingNews, setBreakingNews] = useState(true);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/storage/news/preferences", { credentials: "same-origin" })
      .then(async (response) => {
        const payload = await response.json() as { data?: { metals?: NewsMetal[]; categories?: NewsCategory[]; dailyDigest?: boolean; breakingNews?: boolean }; error?: string };
        if (!response.ok) throw new Error(payload.error || "Unable to load preferences.");
        const data = payload.data;
        if (!data) return;
        setMetals(data.metals || []);
        setCategories(data.categories || []);
        setDailyDigest(Boolean(data.dailyDigest));
        setBreakingNews(data.breakingNews !== false);
      })
      .catch((error: unknown) => setStatus(error instanceof Error ? error.message : "Unable to load preferences."))
      .finally(() => setLoading(false));
  }, []);
  const toggle = <T extends string>(value: T, values: T[], setter: (next: T[]) => void) => setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  async function save() {
    setStatus("Saving...");
    try {
      const response = await fetch("/api/storage/news/preferences", { method: "PATCH", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ metals, categories, dailyDigest, breakingNews }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to save preferences.");
      setStatus("Preferences saved");
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : "Unable to save preferences.");
    }
  }
  return <section className="glass-panel news-preferences-panel"><div className="panel-head"><div><span className="finance-eyebrow">Personalization</span><h2>News preferences</h2></div></div><p>Choose the India finance themes used for your news filters and future notifications.</p>{loading ? <p role="status">Loading your preferences...</p> : <><fieldset><legend>Metals</legend><div className="news-choice-grid">{(["gold", "silver", "platinum", "copper"] as NewsMetal[]).map((item) => <label key={item}><input type="checkbox" checked={metals.includes(item)} onChange={() => toggle(item, metals, setMetals)} />{item}</label>)}</div></fieldset><fieldset><legend>Finance topics</legend><div className="news-choice-grid">{(["metals", "stocks", "crypto", "funds", "insurance", "bonds", "currencies", "markets", "investing", "analysis"] as NewsCategory[]).map((item) => <label key={item}><input type="checkbox" checked={categories.includes(item)} onChange={() => toggle(item, categories, setCategories)} />{item}</label>)}</div></fieldset><label className="news-switch"><input type="checkbox" checked={breakingNews} onChange={(event) => setBreakingNews(event.target.checked)} />Breaking-news alerts</label><label className="news-switch"><input type="checkbox" checked={dailyDigest} onChange={(event) => setDailyDigest(event.target.checked)} />Daily market digest</label><div className="news-preferences-actions"><button className="primary-button" type="button" onClick={save}>Save preferences</button><span role="status">{status}</span></div></>}</section>;
}
