"use client";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { searchMetalEntries, type MetalSearchEntry } from "../../lib/metals-search";
export default function MetalsExplore({ entries }: { entries: MetalSearchEntry[] }) {
  const [query, setQuery] = useState(""); const [open, setOpen] = useState(false); const [active, setActive] = useState(-1);
  const id = useId(); const input = useRef<HTMLInputElement>(null); const router = useRouter();
  const results = searchMetalEntries(entries, query);
  useEffect(() => { if (open && active >= 0) document.getElementById(`${id}-${active}`)?.scrollIntoView({ block: "nearest" }); }, [active, id, open]);
  return <div className="metals-explore" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <label htmlFor={id}>Explore metals, tools and guides</label>
    <div className="metals-explore-input"><input id={id} ref={input} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={`${id}-list`} aria-activedescendant={open && active >= 0 ? `${id}-${active}` : undefined} autoComplete="off" maxLength={80} placeholder="Search gold, Mumbai, making charges…" value={query} onFocus={() => setOpen(true)} onChange={event => { setQuery(event.target.value); setOpen(true); setActive(-1); }} onKeyDown={event => {
      if (event.key === "Escape") { setOpen(false); setActive(-1); }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setOpen(true); setActive(current => results.length ? current < 0 ? event.key === "ArrowDown" ? 0 : results.length - 1 : (current + (event.key === "ArrowDown" ? 1 : results.length - 1)) % results.length : -1); }
      if (event.key === "Enter" && open && active >= 0 && results[active]) { event.preventDefault(); setOpen(false); router.push(results[active].url); }
    }} /><button type="button" aria-label="Clear metal search" onClick={() => { setQuery(""); setActive(-1); setOpen(true); input.current?.focus(); }}>Clear</button></div>
    {open ? <div className="metals-search-popup"><ul id={`${id}-list`} role="listbox" aria-label="Metal search results">{results.map((entry, index) => <li role="presentation" key={entry.url}><Link role="option" aria-selected={active === index} id={`${id}-${index}`} href={entry.url} onMouseEnter={() => setActive(index)} onClick={() => setOpen(false)}><span className="metals-search-group">{entry.group}</span><span>{entry.title}</span><small>{entry.hint}</small></Link></li>)}</ul>{results.length === 0 ? <p role="status">No matches. Try a metal, calculator or guide. Local prices are listed only when a verified source exists.</p> : <span className="metals-sr-only" role="status">{results.length} results. Use arrow keys and Enter.</span>}</div> : null}
  </div>;
}
