"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="en"><body><main className="error-page"><h1>GoldSilverPrices is temporarily unavailable.</h1><button className="primary-button" type="button" onClick={() => reset()}>Reload</button></main></body></html>;
}
