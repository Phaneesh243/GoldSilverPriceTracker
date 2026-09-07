import { unsubscribeEmail } from "../../../../lib/notification-email";
export const runtime = "nodejs";
export async function GET() {
  // GET is inert so email security scanners cannot unsubscribe the recipient.
  return new Response('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><title>Unsubscribe from email editions</title><main><h1>Stop market update emails?</h1><p>This does not change browser or in-app preferences.</p><form method="post"><button>Unsubscribe from email</button></form></main></html>', { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex" } });
}
export async function POST(request: Request) {
  try {
    await unsubscribeEmail(new URL(request.url).searchParams.get("token") || "");
    return new Response("Email editions disabled. You can manage other channels from Notifications.", { headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" } });
  } catch { return Response.json({ error: "Invalid unsubscribe link. Sign in to manage preferences instead." }, { status: 400 }); }
}
