import { currentStorageUser, errorResponse, ok, readBody } from "../../../../lib/storage-route";
import { createAlert, listAlerts } from "../../../../lib/storage";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await currentStorageUser();
    return ok(await listAlerts(user.id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentStorageUser();
    return ok(await createAlert(user.id, await readBody(request)), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
