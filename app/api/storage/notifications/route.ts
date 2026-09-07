import { requireAccount, errorResponse, ok } from "../../../../lib/storage-route";
import { listNotifications } from "../../../../lib/storage";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireAccount();
    return ok(await listNotifications(user.id));
  } catch (error) {
    return errorResponse(error);
  }
}

// Only signed background jobs may create market notifications.
