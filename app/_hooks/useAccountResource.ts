"use client";

import { useEffect, useSyncExternalStore } from "react";

type State<T> = { data: T | null; loading: boolean; error: string; unauthorized: boolean };
type Store = { state: State<unknown>; listeners: Set<() => void>; controller?: AbortController; pending?: Promise<void> };
const stores = new Map<string, Store>();
const empty: State<never> = { data: null, loading: true, error: "", unauthorized: false };
let connected = false;
const EVENT = "gsp-account-data-v2";

function getStore(url: string) {
  if (!stores.has(url)) stores.set(url, { state: empty, listeners: new Set() });
  return stores.get(url)!;
}
function emit(store: Store) { store.listeners.forEach((listener) => listener()); }

export async function accountRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const payload = await response.json();
  if (!response.ok || payload.ok === false) throw new Error(payload.error || "Unable to save. Please try again.");
  return payload.data as T;
}

async function refresh(url: string) {
  const store = getStore(url);
  if (store.pending) return store.pending;
  const controller = new AbortController();
  store.controller = controller;
  const work = (async () => {
    try {
      const response = await fetch(url, { cache: "no-store", signal: controller.signal });
      const payload = await response.json();
      if (controller.signal.aborted) return;
      store.state = response.ok ? { data: payload.data, loading: false, error: "", unauthorized: false } : { data: null, loading: false, unauthorized: response.status === 401, error: payload.error || "Data is temporarily unavailable." };
    } catch {
      if (!controller.signal.aborted) store.state = { data: null, loading: false, error: "Unable to load your account data. Try again.", unauthorized: false };
    } finally {
      if (store.controller === controller) { store.pending = undefined; emit(store); }
    }
  })();
  store.pending = work;
  return work;
}

function invalidate() {
  for (const [url, store] of stores) {
    store.controller?.abort();
    store.pending = undefined;
    store.state = empty;
    emit(store);
    if (store.listeners.size) void refresh(url);
  }
}
export function invalidateAccountData() {
  invalidate();
  // This contains no account data; other tabs discard their stale caches.
  try { localStorage.setItem(EVENT, crypto.randomUUID()); } catch { /* storage may be disabled */ }
}

function connect() {
  if (connected) return;
  connected = true;
  window.addEventListener("storage", (event) => { if (event.key === EVENT) invalidate(); });
  const visible = () => { if (document.visibilityState === "visible") for (const [url, store] of stores) if (store.listeners.size) void refresh(url); };
  window.addEventListener("focus", visible);
  document.addEventListener("visibilitychange", visible);
  navigator.serviceWorker?.addEventListener("message", visible);
  window.setInterval(visible, 30_000);
}

export function useAccountResource<T>(url: string) {
  const store = getStore(url);
  const state = useSyncExternalStore((listener) => { store.listeners.add(listener); return () => { store.listeners.delete(listener); }; }, () => store.state, () => empty) as State<T>;
  useEffect(() => { connect(); void refresh(url); }, [url]);
  return { ...state, refresh: () => refresh(url) };
}
