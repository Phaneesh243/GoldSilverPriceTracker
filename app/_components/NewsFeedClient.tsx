"use client";

import Image from "next/image";
import Link from "next/link";
import { Bookmark, ExternalLink, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { NewsCategory, NewsItem, NewsMetal } from "../../lib/news";

const imagePaths: Record<NewsItem["imageHint"], string> = {
  "gold-bars": "/news/gold-bars-01.jpg",
  "silver-coins": "/news/silver-coins-03.jpg",
  "market-chart": "/news/market-chart-05.jpg",
  jewelry: "/news/gold-jewellery-04.jpg",
  "city-rates": "/news/gold-rings-08.jpg",
  bullion: "/news/gold-bullion-02.jpg",
};

const metals: Array<{ value: NewsMetal; label: string }> = [
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
  { value: "platinum", label: "Platinum" },
  { value: "copper", label: "Copper" },
];

const categories: Array<{ value: NewsCategory; label: string }> = [
  { value: "metals", label: "Metals" },
  { value: "stocks", label: "Stocks" },
  { value: "crypto", label: "Crypto" },
  { value: "funds", label: "Mutual funds" },
  { value: "insurance", label: "Insurance" },
  { value: "bonds", label: "Bonds" },
  { value: "currencies", label: "Currencies" },
  { value: "markets", label: "Markets" },
  { value: "investing", label: "Investing" },
  { value: "analysis", label: "Analysis" },
];

type SavedResponse = { ok?: boolean; data?: Array<{ id: string; articleId: string }> };

async function readApiError(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error || fallback;
  } catch {
    return fallback;
  }
}

function formatDate(value: string) {
  if (!value) return "Latest";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Latest";
  return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function imageFor(item: NewsItem) {
  return imagePaths[item.imageHint] || "/news/gold-bars-01.jpg";
}

export default function NewsFeedClient({
  initialItems,
  metal,
  category,
}: {
  initialItems: NewsItem[];
  metal?: NewsMetal;
  category?: NewsCategory;
}) {
  const [items, setItems] = useState(initialItems);
  const [selectedMetal, setSelectedMetal] = useState<NewsMetal | "all">(metal || "all");
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | "all">(category || "all");
  const [savedByArticle, setSavedByArticle] = useState<Record<string, string>>({});
  const [busyArticle, setBusyArticle] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/storage/news/saved", { credentials: "same-origin" })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Saved news unavailable"))))
      .then((payload: SavedResponse) => {
        const saved = Object.fromEntries((payload.data || []).map((item) => [item.articleId, item.id]));
        setSavedByArticle(saved);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const isInitial = selectedMetal === (metal || "all") && selectedCategory === (category || "all");
    if (isInitial) {
      setItems(initialItems);
      return;
    }
    const params = new URLSearchParams();
    if (selectedMetal !== "all") params.set("metal", selectedMetal);
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    setError("");
    fetch(`/api/news?${params.toString()}`, { credentials: "same-origin" })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("News unavailable"))))
      .then((payload: { items?: NewsItem[] }) => setItems(payload.items || []))
      .catch(() => setError("News is temporarily unavailable. Try again shortly."));
  }, [category, initialItems, metal, selectedCategory, selectedMetal]);

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedMetal !== "all" && !item.metals.includes(selectedMetal)) return false;
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
      return true;
    });
  }, [items, selectedCategory, selectedMetal]);

  async function toggleSaved(item: NewsItem) {
    setBusyArticle(item.id);
    setError("");
    try {
      const savedId = savedByArticle[item.id];
      const response = savedId
        ? await fetch(`/api/storage/news/saved/${encodeURIComponent(savedId)}`, { method: "DELETE" })
        : await fetch("/api/storage/news/saved", {
            method: "POST",
            credentials: "same-origin",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              articleId: item.id,
              slug: item.slug,
              title: item.title,
              source: item.source,
              sourceUrl: item.link,
              imageUrl: item.imageUrl,
            }),
          });
      if (!response.ok) throw new Error(await readApiError(response, "Unable to update saved news."));
      const payload = (await response.json()) as { data?: { id?: string } };
      setSavedByArticle((current) => {
        const next = { ...current };
        if (savedId) delete next[item.id];
        else if (payload.data?.id) next[item.id] = payload.data.id;
        return next;
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update saved news.");
    } finally {
      setBusyArticle(null);
    }
  }

  return (
    <div className="news-feed-shell">
      <div className="news-feed-toolbar">
        <div className="news-filter-tabs" aria-label="News filters">
          <button type="button" className={selectedMetal === "all" && selectedCategory === "all" ? "active" : ""} onClick={() => { setSelectedMetal("all"); setSelectedCategory("all"); }}>All news</button>
          {metals.map((item) => <button type="button" className={selectedMetal === item.value ? "active" : ""} key={item.value} onClick={() => { setSelectedMetal(item.value); setSelectedCategory("all"); }}>{item.label}</button>)}
          {categories.map((item) => <button type="button" className={selectedCategory === item.value ? "active" : ""} key={item.value} onClick={() => { setSelectedCategory(item.value); setSelectedMetal("all"); }}>{item.label}</button>)}
        </div>
        <Link className="news-preferences-link" href="/news/preferences">News preferences</Link>
      </div>

      {error ? <p className="news-inline-error" role="status">{error}</p> : null}
      {!visibleItems.length ? <div className="news-empty"><RefreshCw size={24} /><h2>No matching stories</h2><p>Try another filter or check back when the next market update arrives.</p></div> : null}
      <div className="news-feed-grid">
        {visibleItems.map((item) => (
          <article className="news-feed-card" key={item.id}>
            <Link href={`/news/article/${encodeURIComponent(item.slug)}`} className="news-feed-image-link" aria-label={`Read ${item.title}`}>
              <Image className="news-feed-image" src={imageFor(item)} alt="" width={720} height={405} />
            </Link>
            <div className="news-feed-content">
              <div className="news-card-meta"><span>{item.category}</span><time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time></div>
              <Link href={`/news/article/${encodeURIComponent(item.slug)}`}><h2>{item.title}</h2></Link>
              <p>{item.summary || "Market context and the latest developments from the original publisher."}</p>
              <div className="news-card-footer">
                <a className="news-source-link" href={item.link} target="_blank" rel="noopener noreferrer">{item.source} <ExternalLink size={13} /></a>
                <button type="button" className={savedByArticle[item.id] ? "news-save-button saved" : "news-save-button"} aria-label={savedByArticle[item.id] ? "Remove saved story" : "Save story"} aria-pressed={Boolean(savedByArticle[item.id])} disabled={busyArticle === item.id} onClick={() => toggleSaved(item)}>
                  <Bookmark size={16} fill={savedByArticle[item.id] ? "currentColor" : "none"} />{savedByArticle[item.id] ? "Saved" : "Save"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
