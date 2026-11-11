"use client";

// Manager sign-in at the bottom of the sidebar. Signed in, the team's data is
// shared across devices (cloud.ts); signed out, it isn't shown.
import { useState, type FormEvent } from "react";
import { Cloud, CloudOff, LoaderCircle, LogOut } from "lucide-react";
import { signIn, signOut } from "@/lib/cloud";
import { useCloud } from "@/lib/hooks/useLocalStorage";

const input =
  "w-full h-8 px-2.5 rounded-md border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel)] text-[12.5px] text-[var(--cpm-text)] outline-none focus:border-[var(--cpm-accent)]";

export function AccountBox() {
  const cloud = useCloud();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(await signIn(email, password));
    setBusy(false);
    setPassword("");
  };

  let body;
  if (cloud.status === "loading" || cloud.status === "syncing") {
    body = (
      <div className="flex items-center gap-2 text-[12px] text-[var(--cpm-text-faint)]">
        <LoaderCircle size={14} className="animate-spin" /> {cloud.status === "syncing" ? "Loading shared data…" : "Checking sign-in…"}
      </div>
    );
  } else if (cloud.status === "signedOut") {
    body = open ? (
      <form onSubmit={submit} className="flex flex-col gap-1.5">
        <div className="text-[11px] font-bold uppercase tracking-[.12em] text-[var(--cpm-text-faint)]">Manager sign-in</div>
        <input className={input} type="email" autoComplete="username" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input
          className={input}
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <div className="text-[11.5px] leading-snug text-[var(--cpm-accent-text)]">{error}</div>}
        <div className="flex gap-1.5">
          <button
            type="submit"
            disabled={busy}
            className="flex-1 h-8 rounded-md bg-[var(--cpm-accent)] text-[12.5px] font-semibold text-[var(--cpm-accent-ink)] disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-8 px-2.5 rounded-md border border-[var(--cpm-border-strong)] text-[12px] text-[var(--cpm-text-dim)] hover:text-[var(--cpm-text)]"
          >
            Cancel
          </button>
        </div>
      </form>
    ) : (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-start gap-2 text-[11.5px] leading-snug text-[var(--cpm-text-faint)]">
          <CloudOff size={14} className="shrink-0 mt-px" /> Sign in to see and save the team&apos;s data.
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-8 rounded-md bg-[var(--cpm-accent)] text-[12.5px] font-semibold text-[var(--cpm-accent-ink)]"
        >
          Manager sign-in
        </button>
      </div>
    );
  } else {
    body = (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Cloud size={14} className="shrink-0 text-[var(--cpm-green)]" />
          <span className="flex-1 min-w-0 truncate text-[12px] font-semibold text-[var(--cpm-text)]" title={cloud.email}>
            {cloud.email}
          </span>
          <button
            type="button"
            onClick={() => signOut()}
            title="Sign out"
            className="inline-flex items-center gap-1 h-7 px-2 rounded-md border border-[var(--cpm-border-strong)] text-[11.5px] text-[var(--cpm-text-dim)] hover:text-[var(--cpm-text)]"
          >
            <LogOut size={12} /> Sign out
          </button>
        </div>
        <div className="text-[11px] text-[var(--cpm-text-faint)]">Saved for the whole team, on every device.</div>
      </div>
    );
  }

  return (
    <div className="shrink-0 mt-auto px-3 py-3 border-t border-[var(--cpm-border)]">
      {body}
      {cloud.message && <div className="mt-1.5 text-[11px] leading-snug text-[var(--cpm-accent-text)]">{cloud.message}</div>}
    </div>
  );
}
