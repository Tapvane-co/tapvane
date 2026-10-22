import type { CSSProperties } from "react";
import type { CardColours, CardLayout, Finish } from "@/lib/shop";
import { initials } from "@/lib/profiles";
import QrCode from "@/components/QrCode";

// The Tapvane card, drawn in code (PRD section 8). Used on the website and in the card designer.
//
// Two ways to size it:
//  * no `width`: it fills its container and everything scales with it (uses CSS container units);
//  * `width` in pixels: a fixed size that is much cheaper for the browser, used for small thumbnails
//    and for the animated demo on the Home page.

export function NfcWaveIcon({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className={className} style={style} aria-hidden="true">
      <path d="M8 8.5a5 5 0 0 1 0 7" />
      <path d="M11.5 6a8.5 8.5 0 0 1 0 12" />
      <path d="M15 3.5a12 12 0 0 1 0 17" />
    </svg>
  );
}

// The default look: Onyx front with Gold, Gold back.
export const noirGold: CardColours = {
  slug: "noir-gold",
  name: "Noir & Gold",
  frontBg: "#0B0B0C",
  frontText: "#EDE6D6",
  accent: "#C9A34E",
  backBg: "#C9A34E",
  backText: "#0B0B0C",
};

const shape = "relative overflow-hidden";

export default function CardMockup({
  side = "front",
  layout = "classic",
  colours = noirGold,
  finish = "standard",
  name = "Tapvane",
  title = "Tap. Share. Connect.",
  company = "",
  width,
  qrValue = "https://tapvane.com",
  className = "",
}: {
  side?: "front" | "back";
  layout?: CardLayout;
  colours?: CardColours;
  finish?: Finish;
  name?: string;
  title?: string;
  company?: string;
  width?: number;
  // What the QR code on the back opens. On the website it is a sample; the production sheet passes the card's real chip address.
  qrValue?: string;
  className?: string;
}) {
  const subtitle = [title, company].filter(Boolean).join(" · ");
  const glossy = finish === "standard";
  const shadow = glossy ? "shadow-2xl shadow-black/60" : "shadow-xl shadow-black/40";

  // One "unit" is 1% of the card's width. n units -> "n cqw" (fills container) or "n em" (fixed width).
  const u = (n: number) => (width ? `${n}em` : `${n}cqw`);
  const box: CSSProperties = width
    ? { width, height: width / 1.586, fontSize: width / 100, borderRadius: `${width * 0.045}px / ${(width / 1.586) * 0.07}px` }
    : { width: "100%", aspectRatio: "1.586", containerType: "inline-size", borderRadius: "4.5% / 7%" };

  if (side === "back") {
    return (
      <div
        className={`${shape} border ${shadow} ${className}`}
        style={{ ...box, background: colours.backBg, color: colours.backText, borderColor: `${colours.backText}40` }}
        role="img"
        aria-label="Back of a Tapvane card"
      >
        {glossy && <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/15" />}
        <div className="absolute flex flex-col justify-center" style={{ left: u(7), top: 0, bottom: 0, right: u(46) }}>
          <span className="font-display uppercase tracking-[0.3em]" style={{ fontSize: u(7) }}>Tapvane</span>
          <span className="uppercase tracking-[0.25em]" style={{ fontSize: u(2.8), marginTop: u(2.2) }}>Tap or scan</span>
          <span className="opacity-70" style={{ fontSize: u(2.4), marginTop: u(1) }}>to connect</span>
        </div>
        <QrCode
          value={qrValue}
          className="absolute"
          style={{ right: u(6), top: "50%", transform: "translateY(-50%)", width: u(34), height: u(34), borderRadius: u(2) }}
        />
      </div>
    );
  }

  const shownName = name || "Your name";
  const wordmark = "font-display uppercase tracking-[0.3em]";
  const sub = (
    <p className="truncate opacity-70" style={{ fontSize: u(3.4), marginTop: u(1.2) }}>{subtitle}</p>
  );

  return (
    <div
      className={`${shape} border ${shadow} ${className}`}
      style={{ ...box, background: colours.frontBg, color: colours.frontText, borderColor: `${colours.accent}55` }}
      role="img"
      aria-label={`Tapvane card for ${shownName}`}
    >
      {glossy && (
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${colours.accent}33, transparent 55%)` }} />
      )}

      {layout === "centred" ? (
        <>
          <span className={`absolute left-0 right-0 text-center ${wordmark}`} style={{ top: u(6), fontSize: u(4.5), color: colours.accent }}>Tapvane</span>
          <div className="absolute top-1/2 -translate-y-1/2 text-center" style={{ left: u(6), right: u(6) }}>
            <p className="truncate font-display" style={{ fontSize: u(7.5) }}>{shownName}</p>
            {subtitle && sub}
          </div>
          <NfcWaveIcon className="absolute left-1/2 -translate-x-1/2" style={{ bottom: u(5), width: u(6), height: u(6), color: colours.accent }} />
        </>
      ) : (
        <>
          {layout === "monogram" && (
            <span
              className="absolute font-display leading-none"
              style={{ right: u(-2), top: u(-6), fontSize: u(62), color: colours.accent, opacity: 0.14 }}
              aria-hidden="true"
            >
              {name ? initials(name).slice(0, 1) : "T"}
            </span>
          )}
          <span className={`absolute ${wordmark}`} style={{ left: u(6), top: u(6), fontSize: u(5), color: colours.accent }}>Tapvane</span>
          <NfcWaveIcon className="absolute" style={{ right: u(6), top: u(5), width: u(7), height: u(7), color: colours.accent }} />
          <div className="absolute" style={{ left: u(6), right: u(6), bottom: u(6) }}>
            <p className="truncate font-display" style={{ fontSize: u(6.5) }}>{shownName}</p>
            {subtitle && sub}
          </div>
        </>
      )}
    </div>
  );
}
