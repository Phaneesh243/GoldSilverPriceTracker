import { requireAccount, errorResponse, ok, readBody } from "../../../../lib/storage-route";
import { savePushSubscription, removePushSubscription, pushSubscriptionId } from "../../../../lib/storage";
import { notificationsConfigured } from "../../../../lib/notification-transport";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const user = await requireAccount();
    if (!notificationsConfigured()) return Response.json({ error: "Browser push is not configured." }, { status: 503 });
    const body = await readBody(request);
    const subscription = body.subscription as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    await savePushSubscription(user.id, { endpoint: String(subscription?.endpoint || ""), p256dh: String(subscription?.keys?.p256dh || ""), auth: String(subscription?.keys?.auth || ""), platform: request.headers.get("user-agent") || "" });
    return ok({ saved: true });
  } catch (error) { return errorResponse(error); }
}
export async function DELETE(request: Request) {
  try {
    const user = await requireAccount();
    const body = await readBody(request);
    await removePushSubscription(user.id, pushSubscriptionId(String(body.endpoint || "")));
    return ok({ removed: true });
  } catch (error) { return errorResponse(error); }
}
