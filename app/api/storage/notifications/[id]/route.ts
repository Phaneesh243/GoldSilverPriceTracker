import { requireAccount, errorResponse, ok, readBody } from "../../../../../lib/storage-route";
import { markNotificationRead, removeNotification } from "../../../../../lib/storage";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const user = await requireAccount();
    const { id } = await context.params;
    const body = await readBody(request);
    return ok(await markNotificationRead(user.id, id, body.read !== false));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const user = await requireAccount();
    const { id } = await context.params;
    await removeNotification(user.id, id);
    return ok({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
