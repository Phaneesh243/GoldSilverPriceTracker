"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MetalKey } from "../../lib/metals";

type NewsItem = { id: string; slug: string; title: string; link: string; source: string; publishedAt: string; summary?: string };

export default function MetalNewsClient({ metal, countryCode = "IN" }: { metal: MetalKey; countryCode?: string }) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/news?country=${countryCode}&metal=${metal}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("News unavailable");
        return response.json();
      })
      .then((payload: { items?: NewsItem[] }) => {
        setItems(payload.items ?? []);
        setStatus("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("error");
      });

    return () => controller.abort();
  }, [countryCode, metal]);

  if (status === "loading") return <p>Loading latest market headlines...</p>;
  if (status === "error") return <p>News is temporarily unavailable.</p>;

  return (
    <div className="news-mini-list">
      {items.slice(0, 5).map((item) => (
        <article key={item.id || item.link}>
          <span>{item.source}</span>
          <Link href={`/news/article/${encodeURIComponent(item.slug)}`}><strong>{item.title}</strong></Link>
          {item.summary ? <p>{item.summary}</p> : null}
          <small>{item.publishedAt ? new Date(item.publishedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Latest"}</small>
          <a href={item.link} target="_blank" rel="noopener noreferrer">Read source</a>
        </article>
      ))}
      {!items.length ? <p>No related headlines are available right now.</p> : null}
    </div>
  );
}
