import { currentStorageUser, errorResponse, ok, readBody } from "../../../../../lib/storage-route";
import { listSavedNews, saveNews } from "../../../../../lib/storage";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await currentStorageUser();
    return ok(await listSavedNews(user.id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentStorageUser();
    return ok(await saveNews(user.id, await readBody(request)), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
