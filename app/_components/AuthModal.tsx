"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import AuthForm from "./AuthForm";

export default function AuthModal({ mode, onClose, onSwitchMode, onSuccess }: { mode: "login" | "register"; onClose: () => void; onSwitchMode: (mode: "login" | "register") => void; onSuccess?: () => void }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="auth-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
        <button className="auth-modal-close" aria-label="Close authentication dialog" onClick={onClose} type="button"><X size={20} /></button>
        <AuthForm embedded mode={mode} onSuccess={() => { onClose(); onSuccess?.(); }} onSwitchMode={onSwitchMode} />
      </div>
    </div>
  );
}
