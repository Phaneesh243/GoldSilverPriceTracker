import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { clearSessionCookie, deleteSession, SESSION_COOKIE } from "../../../../lib/storage";

export const runtime = "nodejs";

export async function POST() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) await deleteSession(token);
  await clearSessionCookie();
  return NextResponse.json({ ok: true, data: { loggedOut: true } });
}
