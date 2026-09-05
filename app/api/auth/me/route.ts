import { NextResponse } from "next/server";
import { currentStorageUser, errorResponse } from "../../../../lib/storage-route";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await currentStorageUser();
    const profile = user.profile;
    return NextResponse.json({ ok: true, data: { user: { id: profile.id, email: profile.email, username: profile.username, displayName: profile.displayName, emailVerified: profile.emailVerified, anonymous: user.anonymous, createdAt: profile.createdAt, updatedAt: profile.updatedAt } } });
  } catch (error) {
    return errorResponse(error);
  }
}
