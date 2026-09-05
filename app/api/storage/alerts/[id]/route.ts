import { currentStorageUser, errorResponse, ok, readBody } from "../../../../../lib/storage-route";
import { removeAlert, updateAlert } from "../../../../../lib/storage";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const user = await currentStorageUser();
    const { id } = await context.params;
    return ok(await updateAlert(user.id, id, await readBody(request)));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const user = await currentStorageUser();
    const { id } = await context.params;
    await removeAlert(user.id, id);
    return ok({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
