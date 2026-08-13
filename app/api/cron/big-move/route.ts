import { NextResponse } from "next/server";
import { sendBigMoveAlerts } from "../../../../lib/push-notifications";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
    if (request.headers.get("x-vercel-cron")) {
        return true;
    }

    const secret = process.env.CRON_SECRET;
    if (!secret) {
        return false;
    }

    const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    return provided === secret;
}

export async function GET(request: Request) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    try {
        const result = await sendBigMoveAlerts();
        return NextResponse.json({ ok: true, ...result });
    } catch (error) {
        return NextResponse.json(
            {
                error: "Big-move alert job could not run.",
                message: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 503 },
        );
    }
}
