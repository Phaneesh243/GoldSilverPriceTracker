import { currentStorageUser, errorResponse, ok, readBody } from "../../../../lib/storage-route";
import { updateUserProfile } from "../../../../lib/storage";

export const runtime = "nodejs";

function safeProfile(profile: Awaited<ReturnType<typeof currentStorageUser>>["profile"]) {
  return { id: profile.id, email: profile.email, username: profile.username, displayName: profile.displayName, status: profile.status, emailVerified: profile.emailVerified, anonymous: profile.anonymous, createdAt: profile.createdAt, updatedAt: profile.updatedAt };
}

export async function GET() {
  try {
    const user = await currentStorageUser();
    return ok(safeProfile(user.profile));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await currentStorageUser();
    return ok(safeProfile(await updateUserProfile(user.id, await readBody(request))));
  } catch (error) {
    return errorResponse(error);
  }
}
