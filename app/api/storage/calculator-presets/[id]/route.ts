import { currentStorageUser, errorResponse, ok } from "../../../../../lib/storage-route";
import { removeCalculatorPreset } from "../../../../../lib/storage";

export const runtime = "nodejs";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await currentStorageUser();
    const { id } = await context.params;
    await removeCalculatorPreset(user.id, id);
    return ok({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
