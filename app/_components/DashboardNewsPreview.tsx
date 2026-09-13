"use client";
import Link from "next/link";
import { useCallback } from "react";
import { ArrowRight, RefreshCw } from "lucide-react";
import type { NewsFeed } from "../../lib/news";
import { useLiveRefresh } from "../_hooks/useLiveRefresh";

export default function DashboardNewsPreview() {
  const load = useCallback(async (signal: AbortSignal) => {
    const response = await fetch("/api/news?country=IN", { cache: "no-store", signal });
    if (!response.ok) throw new Error("Headlines are unavailable. Please retry.");
    return response.json() as Promise<NewsFeed>;
  }, []);
  const live = useLiveRefresh({ load, intervalMs: 600000 });
  const items = live.data?.items?.slice(0, 5) || [];
  return <section className="glass-panel dashboard-news-panel">
    <div className="dashboard-section-heading dashboard-news-heading">
      <div><span className="finance-eyebrow">Latest feed</span><h2>Metals market news</h2><p>Publisher-attributed headlines for your metals research.</p></div>
      <Link href="/news">Read all <ArrowRight size={15} /></Link>
    </div>
    {live.loading ? <p role="status">Loading headlines…</p> : live.error ? <p role="status">{live.error} Previously loaded headlines are not a fresh feed.</p> : !items.length ? <p>No recent headlines are available.</p> : null}
    <div className="dashboard-news-list">{items.map(item => <a className="dashboard-news-item" href={item.link} target="_blank" rel="noopener noreferrer" key={item.id}>
      <span>{item.source}</span><b>{item.title}</b><small><time dateTime={item.publishedAt}>{new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(item.publishedAt))} IST</time></small>
    </a>)}</div>
    <div className="dashboard-section-heading"><small>Google News RSS · {live.data?.fetchedAt ? "Feed retrieved " + new Intl.DateTimeFormat("en-IN", {dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(live.data.fetchedAt)) + " IST" : "Retrieval time unavailable"}</small>
      <button className="outline-button" type="button" disabled={live.loading || live.refreshing} onClick={() => void live.refresh()}><RefreshCw size={15} />Refresh news</button>
    </div>
  </section>;
}
