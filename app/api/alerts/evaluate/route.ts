// Retired deliberately: legacy deployments and bookmarks must never send custom alerts.
function retired() {
  return Response.json({ ok: false, error: "Custom price alerts have been retired. Manage fixed market updates at /notifications." }, { status: 410, headers: { "Cache-Control": "no-store" } });
}
export { retired as GET, retired as POST, retired as PATCH, retired as DELETE };
