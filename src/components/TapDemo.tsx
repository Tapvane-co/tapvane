"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import CardMockup from "@/components/CardMockup";
import { icons } from "@/components/icons";

// A looping demo, built in code (no video): card tapped -> profile opens -> tap WhatsApp -> connected.
// Light on mobile data. If the visitor has "reduce motion" turned on, it shows the opened profile and stays still.

const captions = ["Tap the card", "Your profile opens", "Tap WhatsApp", "You're connected"];
const STEP_MS = 2300;

function subscribeReducedMotion(onChange: () => void) {
  const q = window.matchMedia("(prefers-reduced-motion: reduce)");
  q.addEventListener("change", onChange);
  return () => q.removeEventListener("change", onChange);
}
const reducedMotionNow = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function TapDemo({ className = "" }: { className?: string }) {
  const reduced = useSyncExternalStore(subscribeReducedMotion, reducedMotionNow, () => false);
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  // Only animate while the demo is actually on screen, so it never costs anything when scrolled away.
  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduced || !visible) return;
    const id = setInterval(() => setStep((s) => (s + 1) % captions.length), STEP_MS);
    return () => clearInterval(id);
  }, [reduced, visible]);

  const shown = reduced ? 1 : step;
  const profileOpen = shown >= 1;
  const saving = shown === 2;
  const saved = shown === 3;

  return (
    <div ref={root} className={`mx-auto w-full max-w-[360px] ${className}`}>
      <div
        className="relative h-[400px] w-full"
        role="img"
        aria-label="Animation: a Tapvane card is tapped on a phone, the profile opens, and the visitor taps WhatsApp to connect."
      >
        {/* The phone */}
        <div className="absolute right-2 top-0 z-10 h-[380px] w-[190px] overflow-hidden rounded-[34px] border-[3px] border-line bg-onyx shadow-2xl shadow-black/60">
          <div className="absolute left-1/2 top-2 h-4 w-16 -translate-x-1/2 rounded-full bg-charcoal" />

          {/* Waiting screen, before the tap */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 motion-reduce:transition-none ${
              profileOpen ? "opacity-0" : "opacity-100"
            }`}
          >
            <span className="font-display text-xs uppercase tracking-[0.3em] text-gold/60">Tapvane</span>
          </div>

          {/* The opened profile */}
          <div
            className={`absolute inset-0 flex flex-col transition-[opacity,translate] duration-500 motion-reduce:transition-none ${
              profileOpen ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
          >
            <div className="h-[84px] shrink-0 border-b border-gold bg-charcoal" />
            <div className="flex flex-1 flex-col px-4 pb-4">
              <div className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-onyx bg-charcoal outline outline-1 outline-gold">
                <span className="font-display text-lg text-gold">TV</span>
              </div>
              <p className="mt-2 font-display text-lg leading-tight text-ivory">Tapvane</p>
              <p className="text-[10px] text-muted">Tap. Share. Connect.</p>
              <div className="mt-4 grid grid-cols-4 gap-1">
                {[icons.call, icons.whatsapp, icons.email, icons.instagram].map((icon, i) => (
                  <span key={i} className="flex h-9 w-9 scale-90 items-center justify-center rounded-full border border-line text-gold">
                    {icon}
                  </span>
                ))}
              </div>
              <span
                className={`mt-auto flex h-10 items-center justify-center rounded-full bg-gold text-xs font-semibold text-onyx transition-[scale] duration-300 motion-reduce:transition-none ${
                  saving ? "scale-95 ring-4 ring-gold/40" : ""
                }`}
              >
                WhatsApp
              </span>
            </div>
          </div>

          {/* "Connected" message */}
          <div
            className={`absolute inset-x-3 bottom-16 flex items-center justify-center gap-2 rounded-full border border-gold bg-charcoal px-3 py-2 text-xs text-ivory transition-[opacity,translate] duration-500 motion-reduce:transition-none ${
              saved ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
          >
            <span className="text-gold">✓</span> Connected
          </div>
        </div>

        {/* The card: slides up to the phone for the tap, then rests */}
        <div
          className={`absolute bottom-8 left-0 w-[210px] transition-[translate,rotate] duration-700 ease-out motion-reduce:transition-none ${
            shown === 0 ? "z-20 translate-x-14 -translate-y-24 -rotate-3" : "z-0 -translate-x-5 translate-y-4 -rotate-12"
          }`}
        >
          <CardMockup width={210} />
          {shown === 0 && !reduced && (
            <span className="pointer-events-none absolute -right-3 top-1/2 h-12 w-12 -translate-y-1/2 animate-ping rounded-full border border-gold" />
          )}
        </div>
      </div>

      <p className="mt-2 text-center text-sm text-ivory" aria-live="off">
        {reduced ? "Tap the card. Your profile opens." : captions[shown]}
      </p>
      {!reduced && (
        <div className="mt-3 flex justify-center gap-2" aria-hidden="true">
          {captions.map((_, i) => (
            <span key={i} className={`h-1.5 w-6 rounded-full transition-colors ${i === shown ? "bg-gold" : "bg-line"}`} />
          ))}
        </div>
      )}
    </div>
  );
}
