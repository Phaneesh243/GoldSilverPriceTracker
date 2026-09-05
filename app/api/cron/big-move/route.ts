import { NextResponse } from "next/server";
import { sendBigMoveAlerts } from "../../../../lib/push-notifications";
import { isAuthorizedCron } from "../../../../lib/cron-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
    if (!isAuthorizedCron(request)) {
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
