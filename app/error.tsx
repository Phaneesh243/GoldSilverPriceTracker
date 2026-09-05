"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="error-page"><span className="finance-eyebrow">Unexpected error</span><h1>We could not load this page.</h1><p>Retry the request or return to the dashboard. Provider outages are shown as unavailable data.</p><div><button className="primary-button" type="button" onClick={() => reset()}>Try again</button><Link className="outline-button" href="/">Dashboard</Link></div></main>;
}
