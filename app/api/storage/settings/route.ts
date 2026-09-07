import { requireAccount, errorResponse, ok, readBody } from "../../../../lib/storage-route";
import { getUserSettings, updateUserSettings } from "../../../../lib/storage";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireAccount();
    return ok(await getUserSettings(user.id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAccount();
    return ok(await updateUserSettings(user.id, await readBody(request)));
  } catch (error) {
    return errorResponse(error);
  }
}
