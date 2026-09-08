"use client";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { adConfiguration } from "../../lib/metals-ads";
type AdSlotProps = {
  id: string;
  label?: string;
  module?: string;
  placement?: "top" | "after-hero" | "mid-content" | "before-footer" | "sidebar";
  format?: "responsive" | "banner" | "native";
};

export default function AdSlot({ id, label = "Advertisement", module = "finance", placement = "mid-content", format = "responsive" }: AdSlotProps) {
  const config = adConfiguration(id, { enabled: process.env.NEXT_PUBLIC_ADS_ENABLED, client: process.env.NEXT_PUBLIC_ADSENSE_CLIENT, slots: process.env.NEXT_PUBLIC_ADSENSE_SLOTS, test: process.env.NEXT_PUBLIC_DISABLE_EXTERNAL_ADS });
  const [consent, setConsent] = useState(false);
  const [ready, setReady] = useState(false);
  const [state, setState] = useState("loading");
  const element = useRef<HTMLModElement>(null);
  const requested = useRef(false);
  useEffect(() => {
    // A reviewed CMP adapter must dispatch this after satisfying regional rules.
    const receive = (event: Event) => {
      const granted = (event as CustomEvent<{ granted?: boolean }>).detail?.granted === true;
      if (!granted) { requested.current = false; setState("loading"); }
      setConsent(granted);
    };
    window.addEventListener("gsp-ad-consent", receive);
    window.dispatchEvent(new Event("gsp-ad-consent-request"));
    return () => window.removeEventListener("gsp-ad-consent", receive);
  }, []);
  useEffect(() => {
    if (!config || !consent || !ready || !element.current || requested.current) return;
    requested.current = true;
    const observer = new MutationObserver(() => { const status = element.current?.getAttribute("data-ad-status"); if (status === "filled" || status === "unfilled") setState(status); });
    observer.observe(element.current, { attributes: true, attributeFilter: ["data-ad-status"] });
    try { const host = window as Window & { adsbygoogle?: unknown[] }; (host.adsbygoogle ||= []).push({}); } catch { setState("error"); }
    const timeout = setTimeout(() => setState(current => current === "loading" ? "unfilled" : current), 15000);
    return () => { observer.disconnect(); clearTimeout(timeout); };
  }, [config?.client, config?.slot, consent, ready]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!config) return null;
  return (
    <aside className="ad-slot metals-ad-slot" data-ad-state={consent ? state : "awaiting-consent"} data-ad-slot={id} data-ad-module={module} data-ad-placement={placement} data-ad-format={format} aria-label={label}>
      <span>{label}</span>
      {consent ? <><Script id="gsp-adsense" src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.client}`} strategy="afterInteractive" crossOrigin="anonymous" onReady={() => setReady(true)} onError={() => setState("error")} /><ins ref={element} className="adsbygoogle" style={{ display: "block", width: "100%" }} data-ad-client={config.client} data-ad-slot={config.slot} data-ad-format="auto" data-full-width-responsive="true" /></> : null}
    </aside>
  );
}
