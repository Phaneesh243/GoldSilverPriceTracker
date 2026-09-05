"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type AuthFormProps = {
  mode: "login" | "register";
  embedded?: boolean;
  onSuccess?: () => void;
  onSwitchMode?: (mode: "login" | "register") => void;
};

export default function AuthForm({ mode, embedded = false, onSuccess, onSwitchMode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (mode === "register" && password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, username, displayName, password }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Authentication failed.");
      if (onSuccess) onSuccess();
      else router.push("/");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  const content = (
    <section className="auth-card glass-panel">
        <span className="finance-eyebrow">GoldSilverPrices</span>
        <h1 id="auth-modal-title">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p>{mode === "login" ? "Sign in to sync your watchlist, portfolio and alerts." : "Save your watchlist, transactions, portfolio and alerts across devices."}</p>
        <form className="auth-form" onSubmit={submit}>
          <label><span>Email</span><input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>
          {mode === "register" ? <>
            <label><span>Username</span><input autoComplete="username" minLength={3} onChange={(event) => setUsername(event.target.value)} required value={username} /></label>
            <label><span>Display name</span><input autoComplete="name" onChange={(event) => setDisplayName(event.target.value)} value={displayName} /></label>
          </> : null}
          <label><span>Password</span><input autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label>
          {mode === "register" ? <label><span>Confirm password</span><input autoComplete="new-password" minLength={8} onChange={(event) => setConfirmPassword(event.target.value)} required type="password" value={confirmPassword} /></label> : null}
          <button className="primary-button" disabled={busy} type="submit">{busy ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}</button>
        </form>
        {message ? <p className="form-message" role="alert">{message}</p> : null}
        <p className="auth-switch">
          {mode === "login" ? "New here? " : "Already have an account? "}
          {onSwitchMode ? (
            <button className="auth-switch-action" onClick={() => onSwitchMode(mode === "login" ? "register" : "login")} type="button">
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          ) : (
            <Link href={mode === "login" ? "/register" : "/login"}>{mode === "login" ? "Create an account" : "Sign in"}</Link>
          )}
        </p>
      </section>
  );

  return embedded ? content : <main className="auth-page">{content}</main>;
}
