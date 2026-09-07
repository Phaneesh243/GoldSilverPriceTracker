"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import { invalidateAccountData, useAccountResource } from "../_hooks/useAccountResource";

type AuthUser = {
  email: string | null;
  username: string | null;
  displayName: string | null;
  anonymous: boolean;
};

export default function AuthMenu({ onOpen, refreshToken = 0 }: { onOpen: (mode: "login" | "register") => void; refreshToken?: number }) {
  const router = useRouter();
  const account = useAccountResource<{ user: AuthUser }>("/api/auth/me");
  const user = account.data?.user && !account.data.user.anonymous ? account.data.user : null;
  const loading = account.loading;
  const initials = useMemo(() => {
    const label = user?.displayName || user?.username || user?.email || "User";
    return label.slice(0, 2).toUpperCase();
  }, [user]);

  useEffect(() => { if (refreshToken) invalidateAccountData(); }, [refreshToken]);

  async function signOut() {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) { window.alert("Sign out failed. Please try again."); return; }
    // Avoid showing a previous account's browser notifications on a shared device.
    const registration = await navigator.serviceWorker?.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    await subscription?.unsubscribe().catch(() => false);
    invalidateAccountData();
    router.push("/");
    router.refresh();
  }

  if (loading) return <span className="profile-avatar auth-loading" aria-label="Loading account">…</span>;

  if (!user) return <button className="auth-signin" onClick={() => onOpen("login")} type="button">Sign in</button>;

  return (
    <div className="auth-menu">
      <Link className="profile-avatar" href="/portfolio" aria-label="Open your portfolio" title={user.displayName || user.username || user.email || "Account"}>
        <span>{initials}</span>
      </Link>
      <button className="auth-logout" onClick={() => void signOut()} type="button">Sign out</button>
    </div>
  );
}
