import { getAuthenticatedUser } from "../../../../lib/storage";
import { errorResponse, ok } from "../../../../lib/storage-route";
export const runtime = "nodejs";
export async function GET() {
  try {
    const account = await getAuthenticatedUser();
    if (!account) return ok({ user: null });
    const profile = account.profile;
    return ok({ user: { id: profile.id, email: profile.email, username: profile.username, displayName: profile.displayName, emailVerified: profile.emailVerified, anonymous: false, createdAt: profile.createdAt, updatedAt: profile.updatedAt } });
  } catch (error) { return errorResponse(error); }
}
