import { currentStorageUser, errorResponse, ok, readBody } from "../../../../lib/storage-route";
import { createCalculatorPreset, listCalculatorPresets } from "../../../../lib/storage";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await currentStorageUser();
    return ok(await listCalculatorPresets(user.id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentStorageUser();
    return ok(await createCalculatorPreset(user.id, await readBody(request)), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
