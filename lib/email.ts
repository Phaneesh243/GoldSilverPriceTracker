import "server-only";

const DEFAULT_REPLY_TO = "phaneesh19@gmail.com";

export function emailAlertsConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

type EmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
  idempotencyKey?: string;
};

function validateRecipient(email: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new Error("The alert recipient email address is invalid.");
  }
}

export async function sendAlertEmail(input: EmailInput) {
  validateRecipient(input.to);
  if (!emailAlertsConfigured()) {
    throw new Error("Email alerts are not configured. Add RESEND_API_KEY and RESEND_FROM_EMAIL.");
  }

  const headers: Record<string, string> = {
    accept: "application/json",
    "content-type": "application/json",
    authorization: `Bearer ${process.env.RESEND_API_KEY}`,
  };
  if (input.idempotencyKey) headers["Idempotency-Key"] = input.idempotencyKey;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers,
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: [input.to],
      reply_to: process.env.RESEND_REPLY_TO || DEFAULT_REPLY_TO,
      subject: input.subject,
      text: input.text,
      html: input.html,
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 240);
    throw new Error(`Email provider responded with ${response.status}. ${detail}`);
  }

  return (await response.json()) as { id?: string };
}
