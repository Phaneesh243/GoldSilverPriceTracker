export function isAuthorizedCron(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();

  if (secret && provided && provided === secret) return true;

  // The platform header is useful for local emulation, but must not be the only
  // production gate because request headers can be forged outside the platform.
  return process.env.NODE_ENV !== "production" && request.headers.get("x-vercel-cron") === "1";
}
