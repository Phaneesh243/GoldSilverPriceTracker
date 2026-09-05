import { currentStorageUser, errorResponse, ok, readBody } from "../../../../lib/storage-route";
import { createCalculation, listCalculations } from "../../../../lib/storage";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await currentStorageUser();
    return ok(await listCalculations(user.id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentStorageUser();
    return ok(await createCalculation(user.id, await readBody(request)), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
