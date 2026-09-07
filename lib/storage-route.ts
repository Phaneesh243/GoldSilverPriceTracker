import { NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  getOrCreateStorageUser,
  StorageUnavailableError,
  StorageValidationError,
} from "./storage";

export class AuthenticationRequiredError extends Error {}
export async function requireAccount() {
  const authenticated = await getAuthenticatedUser();
  if (!authenticated) throw new AuthenticationRequiredError("Sign in to access your saved data.");
  return { id: authenticated.profile.id, anonymous: false, profile: authenticated.profile };
}
export async function currentStorageUser() {
  const authenticated = await getAuthenticatedUser();
  if (authenticated) return { id: authenticated.profile.id, anonymous: false, profile: authenticated.profile };
  return getOrCreateStorageUser();
}

export async function readBody(request: Request) {
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  } catch {
    throw new StorageValidationError("Invalid JSON body.");
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof AuthenticationRequiredError) return NextResponse.json({ ok: false, error: error.message }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
  if (error instanceof StorageValidationError) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  if (error instanceof StorageUnavailableError) return NextResponse.json({ ok: false, error: error.message }, { status: 503 });
  console.error("Storage route error", error);
  return NextResponse.json({ ok: false, error: "Storage operation failed." }, { status: 500 });
}

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, { ...init, headers: { ...Object.fromEntries(new Headers(init?.headers)), "Cache-Control": "private, no-store", Vary: "Cookie" } });
}
