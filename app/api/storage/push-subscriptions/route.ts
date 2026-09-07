import { requireAccount, errorResponse, ok, readBody } from "../../../../lib/storage-route";
import { listPushSubscriptions, removePushSubscription, savePushSubscription } from "../../../../lib/storage";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireAccount();
    return ok((await listPushSubscriptions(user.id)).map(({ id, endpoint, platform, createdAt }) => ({ id, endpoint, platform, createdAt })));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAccount();
    const body = await readBody(request);
    const subscription = (body.subscription && typeof body.subscription === "object" ? body.subscription : body) as Record<string, unknown>;
    const keys = (subscription.keys && typeof subscription.keys === "object" ? subscription.keys : {}) as Record<string, unknown>;
    return ok(await savePushSubscription(user.id, { endpoint: String(subscription.endpoint || ""), p256dh: String(keys.p256dh || ""), auth: String(keys.auth || ""), platform: String(body.platform || "") }), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireAccount();
    const body = await readBody(request);
    const id = String(body.id || "");
    if (!id) return errorResponse(new Error("Push subscription id is required."));
    await removePushSubscription(user.id, id);
    return ok({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
