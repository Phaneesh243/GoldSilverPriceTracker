"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type AuthUser = {
  email: string | null;
  username: string | null;
  displayName: string | null;
  anonymous: boolean;
};

export default function AuthMenu({ onOpen, refreshToken = 0 }: { onOpen: (mode: "login" | "register") => void; refreshToken?: number }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const initials = useMemo(() => {
    const label = user?.displayName || user?.username || user?.email || "User";
    return label.slice(0, 2).toUpperCase();
  }, [user]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { data?: { user?: AuthUser } };
      })
      .then((payload) => {
        if (!active) return;
        const nextUser = payload?.data?.user;
        setUser(nextUser && !nextUser.anonymous ? nextUser : null);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshToken]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
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
