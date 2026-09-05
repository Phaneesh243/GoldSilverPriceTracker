import { currentStorageUser, errorResponse, ok, readBody } from "../../../../../lib/storage-route";
import { getNewsPreferences, updateNewsPreferences } from "../../../../../lib/storage";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await currentStorageUser();
    return ok(await getNewsPreferences(user.id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await currentStorageUser();
    return ok(await updateNewsPreferences(user.id, await readBody(request)));
  } catch (error) {
    return errorResponse(error);
  }
}
