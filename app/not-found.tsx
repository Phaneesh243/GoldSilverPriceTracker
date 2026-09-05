import Link from "next/link";

export default function NotFound() {
  return <main className="error-page"><span className="finance-eyebrow">404</span><h1>Page not found.</h1><p>The requested page does not exist or is no longer public.</p><Link className="primary-button" href="/">Back to dashboard</Link></main>;
}
