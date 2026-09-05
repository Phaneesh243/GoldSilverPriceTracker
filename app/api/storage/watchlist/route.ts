import { currentStorageUser, errorResponse, ok, readBody } from "../../../../lib/storage-route";
import { listWatchlist, removeWatchlist, upsertWatchlist } from "../../../../lib/storage";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await currentStorageUser();
    return ok(await listWatchlist(user.id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentStorageUser();
    return ok(await upsertWatchlist(user.id, await readBody(request)), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await currentStorageUser();
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return errorResponse(new Error("Watchlist item id is required."));
    await removeWatchlist(user.id, id);
    return ok({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
