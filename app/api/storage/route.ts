import { errorResponse, currentStorageUser, ok } from "../../../lib/storage-route";
import { getStorageSnapshot } from "../../../lib/storage";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await currentStorageUser();
    return ok(await getStorageSnapshot(user.id));
  } catch (error) {
    return errorResponse(error);
  }
}
