"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type RefreshReason = "initial" | "interval" | "visible" | "online" | "manual";

export type LiveRefreshState<T> = {
  data: T | null;
  error: string;
  loading: boolean;
  refreshing: boolean;
  lastCheckedAt: number | null;
  refresh: () => Promise<void>;
};

export function useLiveRefresh<T>({
  load,
  intervalMs,
  enabled = true,
  initialData = null,
}: {
  load: (signal: AbortSignal, reason: RefreshReason) => Promise<T>;
  intervalMs: number;
  enabled?: boolean;
  initialData?: T | null;
}): LiveRefreshState<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(enabled);
  const [refreshing, setRefreshing] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);
  const dataRef = useRef<T | null>(initialData);
  const controllerRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const requestIdRef = useRef(0);
  const failuresRef = useRef(0);

  const run = useCallback(async (reason: RefreshReason) => {
    if (!enabled) return;
    if (inFlightRef.current && reason !== "manual") return inFlightRef.current;
    if (reason === "manual") controllerRef.current?.abort();

    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    controllerRef.current = controller;
    if (dataRef.current === null) setLoading(true);
    else setRefreshing(true);

    const task = (async () => {
      try {
        const next = await load(controller.signal, reason);
        if (controller.signal.aborted || requestId !== requestIdRef.current) return;
        dataRef.current = next;
        setData(next);
        setError("");
        failuresRef.current = 0;
      } catch (loadError) {
        if (controller.signal.aborted || requestId !== requestIdRef.current) return;
        failuresRef.current = Math.min(failuresRef.current + 1, 4);
        setError(loadError instanceof Error ? loadError.message : "Live data is temporarily unavailable.");
      } finally {
        if (requestId === requestIdRef.current) {
          setLastCheckedAt(Date.now());
          setLoading(false);
          setRefreshing(false);
          inFlightRef.current = null;
        }
      }
    })();
    inFlightRef.current = task;
    return task;
  }, [enabled, load]);

  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let timer: number | undefined;

    const schedule = () => {
      if (stopped) return;
      const delay = Math.min(intervalMs * 2 ** failuresRef.current, intervalMs * 8);
      timer = window.setTimeout(async () => {
        if (document.visibilityState === "visible" && navigator.onLine) await run("interval");
        schedule();
      }, delay);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void run("visible");
    };
    const onOnline = () => void run("online");

    void run("initial").finally(schedule);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    return () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
      controllerRef.current?.abort();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, [enabled, intervalMs, run]);

  const refresh = useCallback(() => run("manual"), [run]);
  return { data, error, loading, refreshing, lastCheckedAt, refresh };
}
