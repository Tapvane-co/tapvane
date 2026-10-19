"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

export const inputClass =
  "min-h-12 w-full rounded-xl border border-line bg-charcoal px-4 text-ivory placeholder:text-stone focus:border-gold focus:outline-none";
export const primaryButton =
  "flex min-h-12 w-full items-center justify-center rounded-full bg-gold px-6 font-semibold text-onyx disabled:opacity-60";

function Shell({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-12">
      <div className="text-center">
        <Link href="/" className="font-display text-gold uppercase tracking-[0.3em] text-xl">
          Tapvane
        </Link>
        <h1 className="mt-6 font-display text-3xl text-ivory">{title}</h1>
        {intro && <p className="mt-2 text-sm text-muted">{intro}</p>}
      </div>
      {children}
    </main>
  );
}

function Message({ kind, children }: { kind: "error" | "ok"; children: ReactNode }) {
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm ${
        kind === "error" ? "border-red-900 text-red-300" : "border-gold text-ivory"
      }`}
    >
      {children}
    </p>
  );
}

// Password box with a Show/Hide button, so people can check what they typed.
function PasswordInput({ autoComplete, minLength }: { autoComplete: string; minLength?: number }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        name="password"
        type={visible ? "text" : "password"}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        className={`${inputClass} pr-20`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 min-w-16 px-4 text-sm text-gold"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}

function friendly(message: string) {
  if (/invalid login/i.test(message)) return "Email or password is not correct.";
  if (/already registered/i.test(message)) return "That email already has an account. Try logging in.";
  if (/rate limit|security purposes|too many/i.test(message)) return "Too many attempts. Please wait a minute and try again.";
  if (/password/i.test(message) && /characters/i.test(message)) return "Password must be at least 8 characters.";
  return message;
}

// Where to go after logging in: only addresses on this site are allowed (never another website).
export function safeNext(next?: string) {
  return next && /^\/(?![/\\])/.test(next) ? next : "/dashboard";
}

const RESEND_WAIT = 60; // seconds between "send a new code" presses (the email service allows about one a minute)

// The code screen only makes sense once the "Confirm sign up" email contains the code ({{ .Token }}).
// Until the founder switches this on (NEXT_PUBLIC_EMAIL_CODE=on), people are told about the link instead.
const CODE_MODE = process.env.NEXT_PUBLIC_EMAIL_CODE === "on";

// Confirming an email address with a 6-digit code instead of a link. The code is checked as soon as
// the sixth digit is typed. Used after sign-up, and for anyone who tries to log in before confirming.
export function VerifyCodeForm({
  email,
  after,
  withNext,
  alreadySent,
  onChangeEmail,
}: {
  email: string;
  after: string;
  withNext: string;
  alreadySent: boolean; // true right after sign-up (a code is on its way); false when someone arrives from log in
  onChangeEmail: () => void;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [wait, setWait] = useState(alreadySent ? RESEND_WAIT : 0);

  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  async function verify(token: string) {
    setBusy(true);
    setError("");
    setNotice("");
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "signup" });
    if (error) {
      setBusy(false);
      setCode("");
      return setError(
        /expired|invalid|incorrect/i.test(error.message)
          ? "That code is not right or has expired. Check the newest email, or ask for a new code."
          : friendly(error.message),
      );
    }
    router.push(after);
  }

  function onChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    if (digits.length === 6 && !busy) verify(digits);
  }

  async function resend() {
    setError("");
    setNotice("");
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}${after}` },
    });
    if (error) {
      setWait(RESEND_WAIT);
      return setError(friendly(error.message));
    }
    setNotice(
      CODE_MODE
        ? "We sent a new code. It can take a minute to arrive. Only the newest code works."
        : "We sent a new link. It can take a minute to arrive. Only the newest link works.",
    );
    setWait(RESEND_WAIT);
  }

  const thing = CODE_MODE ? "code" : "link";
  const intro = CODE_MODE
    ? alreadySent
      ? `We sent a 6-digit code to ${email}. Type it below to confirm your email.`
      : `${email} is not confirmed yet. Type the 6-digit code we emailed you, or ask for a new one.`
    : alreadySent
      ? `We sent a confirmation link to ${email}. Open it to confirm your email, then log in.`
      : `${email} is not confirmed yet. Open the link we emailed you, or ask for a new one.`;

  return (
    <Shell title="Check your email" intro={intro}>
      {CODE_MODE && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (code.length === 6 && !busy) verify(code);
          }}
          className="flex flex-col gap-4"
        >
          <label className="flex flex-col gap-2 text-sm text-muted">
            6-digit code
            <input
              value={code}
              onChange={(e) => onChange(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              autoFocus
              placeholder="······"
              className={`${inputClass} text-center font-mono text-2xl tracking-[0.5em]`}
            />
          </label>
          {error && <Message kind="error">{error}</Message>}
          {notice && <Message kind="ok">{notice}</Message>}
          <button type="submit" disabled={busy || code.length !== 6} className={primaryButton}>
            {busy ? "Checking…" : "Confirm"}
          </button>
        </form>
      )}
      {!CODE_MODE && (
        <>
          {error && <Message kind="error">{error}</Message>}
          {notice && <Message kind="ok">{notice}</Message>}
        </>
      )}
      <div className="flex flex-col items-center gap-1 text-sm text-muted">
        <button
          type="button"
          onClick={resend}
          disabled={wait > 0 || busy}
          className="flex min-h-11 items-center text-gold underline underline-offset-4 disabled:text-stone disabled:no-underline"
        >
          {wait > 0 ? `Send a new ${thing} in ${wait}s` : `Send me a new ${thing}`}
        </button>
        <button type="button" onClick={onChangeEmail} className="flex min-h-11 items-center text-muted underline underline-offset-4">
          Use a different email
        </button>
        <Link href={`/login${withNext}`} className="flex min-h-11 items-center text-muted underline underline-offset-4">
          Back to log in
        </Link>
      </div>
    </Shell>
  );
}

export function SignupForm({ next }: { next?: string }) {
  const router = useRouter();
  const after = safeNext(next);
  const withNext = next ? `?next=${encodeURIComponent(after)}` : "";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")).trim();
    setBusy(true);
    setError("");
    const { data, error } = await createClient().auth.signUp({
      email,
      password: String(f.get("password")),
      options: {
        data: { full_name: String(f.get("name")).trim() },
        emailRedirectTo: `${window.location.origin}${after}`,
      },
    });
    setBusy(false);
    if (error) return setError(friendly(error.message));
    // An email that already has an account comes back with no new identity (and no email is sent).
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return setError("That email already has an account. Try logging in.");
    }
    if (data.session) router.push(after);
    else setPendingEmail(email);
  }

  if (pendingEmail) {
    return (
      <VerifyCodeForm
        email={pendingEmail}
        after={after}
        withNext={withNext}
        alreadySent
        onChangeEmail={() => setPendingEmail(null)}
      />
    );
  }

  return (
    <Shell title="Create your account" intro="Set up your Tapvane profile in a few minutes.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm text-muted">
          Full name
          <input name="name" required maxLength={60} autoComplete="name" className={inputClass} />
        </label>
        <label className="flex flex-col gap-2 text-sm text-muted">
          Email
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </label>
        <label className="flex flex-col gap-2 text-sm text-muted">
          Password (at least 8 characters)
          <PasswordInput autoComplete="new-password" minLength={8} />
        </label>
        <label className="flex items-start gap-3 text-sm text-muted">
          <input name="consent" type="checkbox" required className="mt-1 h-4 w-4 accent-[#C9A34E]" />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="text-gold underline underline-offset-4">Terms of Service</Link> and{" "}
            <Link href="/privacy" className="text-gold underline underline-offset-4">Privacy Policy</Link>.
          </span>
        </label>
        {error && <Message kind="error">{error}</Message>}
        <button type="submit" disabled={busy} className={primaryButton}>
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href={`/login${withNext}`} className="text-gold underline underline-offset-4">Log in</Link>
      </p>
    </Shell>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const after = safeNext(next);
  const withNext = next ? `?next=${encodeURIComponent(after)}` : "";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")).trim();
    setBusy(true);
    setError("");
    const { error } = await createClient().auth.signInWithPassword({
      email,
      password: String(f.get("password")),
    });
    if (error) {
      setBusy(false);
      // Signed up but never confirmed the email: let them type a code (or ask for a new one) right here.
      if (/email not confirmed/i.test(error.message)) return setUnconfirmedEmail(email);
      return setError(friendly(error.message));
    }
    router.push(after);
  }

  if (unconfirmedEmail) {
    return (
      <VerifyCodeForm
        email={unconfirmedEmail}
        after={after}
        withNext={withNext}
        alreadySent={false}
        onChangeEmail={() => setUnconfirmedEmail(null)}
      />
    );
  }

  return (
    <Shell title="Welcome back" intro="Log in to manage your profile.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm text-muted">
          Email
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </label>
        <label className="flex flex-col gap-2 text-sm text-muted">
          Password
          <PasswordInput autoComplete="current-password" />
        </label>
        {error && <Message kind="error">{error}</Message>}
        <button type="submit" disabled={busy} className={primaryButton}>
          {busy ? "Logging in…" : "Log in"}
        </button>
      </form>
      <div className="flex flex-col items-center gap-2 text-sm text-muted">
        <Link href="/forgot-password" className="text-gold underline-offset-4 hover:underline">Forgot your password?</Link>
        <span>
          New here?{" "}
          <Link href={`/signup${withNext}`} className="text-gold underline underline-offset-4">Create account</Link>
        </span>
      </div>
    </Shell>
  );
}

export function ForgotPasswordForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    const { error } = await createClient().auth.resetPasswordForEmail(String(f.get("email")).trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) return setError(friendly(error.message));
    setSent(true);
  }

  return (
    <Shell title="Reset your password" intro="We will email you a link to choose a new password.">
      {sent ? (
        <Message kind="ok">If that email has an account, a reset link is on its way. Check your inbox.</Message>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm text-muted">
            Email
            <input name="email" type="email" required autoComplete="email" className={inputClass} />
          </label>
          {error && <Message kind="error">{error}</Message>}
          <button type="submit" disabled={busy} className={primaryButton}>
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
      <Link href="/login" className="text-center text-sm text-gold underline-offset-4 hover:underline">
        Back to log in
      </Link>
    </Shell>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => data.session && setReady(true));
    return () => data.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    const { error } = await createClient().auth.updateUser({ password: String(f.get("password")) });
    if (error) {
      setBusy(false);
      return setError(friendly(error.message));
    }
    router.push("/dashboard");
  }

  return (
    <Shell title="Choose a new password">
      {ready ? (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm text-muted">
            New password (at least 8 characters)
            <PasswordInput autoComplete="new-password" minLength={8} />
          </label>
          {error && <Message kind="error">{error}</Message>}
          <button type="submit" disabled={busy} className={primaryButton}>
            {busy ? "Saving…" : "Save new password"}
          </button>
        </form>
      ) : (
        <Message kind="error">
          This reset link is not valid or has expired.{" "}
          <Link href="/forgot-password" className="underline">Ask for a new one</Link>.
        </Message>
      )}
    </Shell>
  );
}
