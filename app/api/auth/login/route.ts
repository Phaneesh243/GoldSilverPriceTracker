import { NextResponse } from "next/server";
import { currentStorageUser, errorResponse, readBody } from "../../../../lib/storage-route";
import { authenticateAccount, clearAnonymousIdentityCookie, createSession, migrateAnonymousData, requestIpHash, setSessionCookie, withinAuthRateLimit } from "../../../../lib/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!(await withinAuthRateLimit(request, "login"))) return NextResponse.json({ ok: false, error: "Too many login attempts. Try again later." }, { status: 429 });
    const body = await readBody(request);
    const anonymous = await currentStorageUser();
    const profile = await authenticateAccount(body.email, String(body.password || ""));
    await migrateAnonymousData(anonymous.id, profile.id);
    const session = await createSession(profile.id, { userAgent: request.headers.get("user-agent") || "", ipHash: requestIpHash(request) });
    await setSessionCookie(session.token);
    await clearAnonymousIdentityCookie();
    return NextResponse.json({ ok: true, data: { user: { id: profile.id, email: profile.email, username: profile.username, displayName: profile.displayName, emailVerified: profile.emailVerified, anonymous: false, createdAt: profile.createdAt, updatedAt: profile.updatedAt } } });
  } catch (error) {
    return errorResponse(error);
  }
}
