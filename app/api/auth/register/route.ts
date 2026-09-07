import { NextResponse } from "next/server";
import { errorResponse, readBody } from "../../../../lib/storage-route";
import { clearAnonymousIdentityCookie, registerAccount, requestIpHash, createSession, setSessionCookie, withinAuthRateLimit } from "../../../../lib/storage";

export const runtime = "nodejs";

function publicProfile(profile: { id: string; email: string | null; username: string | null; displayName: string | null; emailVerified: boolean; anonymous: boolean; createdAt: number; updatedAt: number }) {
  return { id: profile.id, email: profile.email, username: profile.username, displayName: profile.displayName, emailVerified: profile.emailVerified, anonymous: profile.anonymous, createdAt: profile.createdAt, updatedAt: profile.updatedAt };
}

export async function POST(request: Request) {
  try {
    if (!(await withinAuthRateLimit(request, "register"))) return NextResponse.json({ ok: false, error: "Too many registration attempts. Try again later." }, { status: 429 });
    const body = await readBody(request);
    const profile = await registerAccount({ email: body.email, username: body.username, displayName: body.displayName, password: String(body.password || "") });
    const session = await createSession(profile.id, { userAgent: request.headers.get("user-agent") || "", ipHash: requestIpHash(request) });
    await setSessionCookie(session.token);
    await clearAnonymousIdentityCookie();
    return NextResponse.json({ ok: true, data: { user: publicProfile(profile) } }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
