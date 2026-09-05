"use client";

import Link from "next/link";
import { Bookmark, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { SavedNewsItem } from "../../lib/storage";

export default function SavedNewsClient() {
  const [items, setItems] = useState<SavedNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/storage/news/saved", { credentials: "same-origin" })
      .then(async (response) => {
        const payload = await response.json() as { data?: SavedNewsItem[]; error?: string };
        if (!response.ok) throw new Error(payload.error || "Unable to load saved stories.");
        setItems(payload.data || []);
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Unable to load saved stories."))
      .finally(() => setLoading(false));
  }, []);

  async function remove(id: string) {
    const response = await fetch(`/api/storage/news/saved/${encodeURIComponent(id)}`, { method: "DELETE", credentials: "same-origin" });
    if (response.ok) setItems((current) => current.filter((item) => item.id !== id));
    else setError("Unable to remove this saved story.");
  }

  if (loading) return <div className="news-empty glass-panel"><p>Loading saved stories...</p></div>;
  if (error) return <div className="news-empty glass-panel"><Bookmark size={28} /><h2>Saved stories are unavailable</h2><p>{error}</p><Link href="/news" className="primary-button">Return to news</Link></div>;
  if (!items.length) return <div className="news-empty glass-panel"><Bookmark size={28} /><h2>No saved stories yet</h2><p>Save a story from the news hub to build your personal reading list.</p><Link href="/news" className="primary-button">Browse news</Link></div>;

  return <section className="glass-panel saved-news-panel"><div className="panel-head"><div><span className="finance-eyebrow">Your library</span><h2>Saved stories</h2></div></div>{items.map((item) => <div className="saved-news-row" key={item.id}><div><span>{item.source}</span><Link href={`/news/article/${encodeURIComponent(item.slug)}`}><strong>{item.title}</strong></Link><small>Saved {new Date(item.savedAt).toLocaleDateString("en-IN")}</small></div><button type="button" aria-label={`Remove ${item.title}`} onClick={() => remove(item.id)}><Trash2 size={17} /></button></div>)}</section>;
}
