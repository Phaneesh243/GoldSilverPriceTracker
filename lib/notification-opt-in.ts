/** Call permission directly from the Allow click, before other async work. */
export type OptInPorts = {
  permission: () => Promise<NotificationPermission | "unsupported">;
  subscribeBrowser: () => Promise<void>;
  save: (notifications: { marketUpdates: boolean; browserPush?: boolean; emailAlerts?: boolean }) => Promise<unknown>;
  verifyEmail: () => Promise<unknown>;
  onSaved?: () => void;
};
export async function allowMarketUpdates(emailVerified: boolean, ports: OptInPorts) {
  const permission = await ports.permission();
  if (permission === "default") return { accepted: false, message: "You can allow market updates next time." };
  let browserPush = false;
  let message = "";
  if (permission === "granted") {
    try { await ports.subscribeBrowser(); browserPush = true; }
    catch { message = "Browser setup failed. Use Retry browser in the notification bell."; }
  } else {
    message = permission === "denied" ? "Browser notifications are blocked. Change this site's browser permissions to enable them." : "Push is not supported here. In-app and eligible email updates are still available.";
  }
  await ports.save({ marketUpdates: true, ...(browserPush ? { browserPush: true } : {}) });
  ports.onSaved?.();
  message += emailVerified ? " Email remains a separate choice: use Allow email in the bell." : " Email remains a separate choice: request verification from the bell.";
  return { accepted: true, message: message.trim() || "Browser and in-app market updates are enabled." };
}
export const INVITATION_DELAY_MS = 7 * 24 * 3600_000;
export function invitationEligible(accepted: boolean, blocked: boolean, visible: boolean, dueAt: number, now: number) {
  return !accepted && !blocked && visible && now >= dueAt;
}
