"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { MetalKey } from "../../lib/metals";
import { metalHeadlines, type MetalHeadline } from "../../lib/metals-headlines";
export default function MetalNews({ metal }: { metal: MetalKey }) {
  const panel = useRef<HTMLElement>(null); const [visible, setVisible] = useState(false); const [attempt, setAttempt] = useState(0);
  const [items, setItems] = useState<MetalHeadline[]>([]); const [status, setStatus] = useState("waiting"); const [fetchedAt, setFetchedAt] = useState("");
  const lastAttempt = useRef(0);
  useEffect(() => {
    const refreshVisible = () => { if (visible && document.visibilityState === "visible" && Date.now() - lastAttempt.current >= 600000) { lastAttempt.current = Date.now(); setAttempt(n => n + 1); } };
    const timer = setInterval(refreshVisible, 600000); document.addEventListener("visibilitychange", refreshVisible); window.addEventListener("focus", refreshVisible);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", refreshVisible); window.removeEventListener("focus", refreshVisible); };
  }, [visible]);
  useEffect(() => { if (!panel.current) return; const observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { setVisible(true); observer.disconnect(); } }, { rootMargin: "200px" }); observer.observe(panel.current); return () => observer.disconnect(); }, []);
  useEffect(() => {
    if (!visible) return; lastAttempt.current = Date.now(); let active = true; const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 15000); setStatus("loading");
    fetch(`/api/metals/news?metal=${metal}&country=IN`, { signal: controller.signal }).then(async response => { if (!response.ok) throw new Error(); const data = await response.json(); if (!active || controller.signal.aborted) return; const next = metalHeadlines(data.items, metal); setItems(next); setFetchedAt(typeof data.fetchedAt === "string" && Number.isFinite(Date.parse(data.fetchedAt)) ? data.fetchedAt : ""); setStatus(next.length ? "ready" : "empty"); }).catch(() => { if (active) setStatus("error"); }).finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [metal, visible, attempt]);
  return <section id="news" ref={panel} className="metals-disclosure"><div className="metals-section-heading"><h2>{metal[0].toUpperCase() + metal.slice(1)} news</h2><Link href={`/news/${metal}`}>All {metal} news →</Link></div>
    {status === "waiting" || status === "loading" ? <p role="status">Loading relevant headlines…</p> : status === "error" ? <p role="status">Headlines are unavailable right now. Previously loaded articles, if any, are not a fresh feed.</p> : status === "empty" ? <p role="status">No recent, relevant headlines passed the source and date checks.</p> : null}
    <ul className="metals-news-list">{items.map(item => <li key={item.link}><a href={item.link} target="_blank" rel="noopener noreferrer">{item.title}</a><span>{item.source} · <time dateTime={item.publishedAt}>{new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(item.publishedAt))} IST</time></span></li>)}</ul>
    <div className="metals-section-heading"><p className="metals-note">Google News RSS discovery links · publisher attribution above. No article text or images copied.{fetchedAt ? ` Feed retrieved ${new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(fetchedAt))} IST.` : ""}</p><button disabled={status === "loading"} onClick={() => { setVisible(true); setAttempt(n => n + 1); }}>Refresh news</button></div>
  </section>;
}
