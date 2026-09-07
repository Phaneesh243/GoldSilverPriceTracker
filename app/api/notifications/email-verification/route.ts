import { requestEmailVerification, confirmEmailVerification } from "../../../../lib/notification-email";
import { requireAccount, errorResponse, ok, readBody } from "../../../../lib/storage-route";
export const runtime = "nodejs";
export async function POST() {
  try { const user = await requireAccount(); await requestEmailVerification(user.id); return ok({ requested: true }); }
  catch (error) { return errorResponse(error); }
}
export async function PATCH(request: Request) {
  try { const user = await requireAccount(); const body = await readBody(request); await confirmEmailVerification(user.id, String(body.token || "")); return ok({ verified: true }); }
  catch (error) { return errorResponse(error); }
}
