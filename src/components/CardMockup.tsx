import type { CardColours, CardLayout, Finish } from "@/lib/shop";
import { initials } from "@/lib/profiles";

// The Tapvane card, drawn in code (PRD section 8). Used on the website and in the card designer.
// Sizes scale with the card's own width, so it looks right at any size.

export function NfcWaveIcon({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
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

const cardShape = "relative aspect-[1.586] w-full overflow-hidden rounded-[4.5%/7%]";

export default function CardMockup({
  side = "front",
  layout = "classic",
  colours = noirGold,
  finish = "standard",
  name = "Tapvane",
  title = "Tap. Share. Connect.",
  company = "",
  className = "",
}: {
  side?: "front" | "back";
  layout?: CardLayout;
  colours?: CardColours;
  finish?: Finish;
  name?: string;
  title?: string;
  company?: string;
  className?: string;
}) {
  const subtitle = [title, company].filter(Boolean).join(" · ");
  const glossy = finish === "standard";
  const shadow = glossy ? "shadow-2xl shadow-black/60" : "shadow-xl shadow-black/40";

  if (side === "back") {
    return (
      <div
        className={`${cardShape} border ${shadow} ${className}`}
        style={{ containerType: "inline-size", background: colours.backBg, color: colours.backText, borderColor: `${colours.backText}40` }}
        role="img"
        aria-label="Back of a Tapvane card"
      >
        {glossy && <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/15" />}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display uppercase tracking-[0.3em]" style={{ fontSize: "9cqw" }}>
            Tapvane
          </span>
          <span className="mt-[2cqw] uppercase tracking-[0.25em]" style={{ fontSize: "3cqw" }}>
            Tap to connect
          </span>
        </div>
      </div>
    );
  }

  const shownName = name || "Your name";
  const wordmark = "font-display uppercase tracking-[0.3em]";

  return (
    <div
      className={`${cardShape} border ${shadow} ${className}`}
      style={{
        containerType: "inline-size",
        background: colours.frontBg,
        color: colours.frontText,
        borderColor: `${colours.accent}55`,
      }}
      role="img"
      aria-label={`Tapvane card for ${shownName}`}
    >
      {glossy && (
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${colours.accent}33, transparent 55%)` }} />
      )}

      {layout === "centred" ? (
        <>
          <span className={`absolute left-0 right-0 top-[6cqw] text-center ${wordmark}`} style={{ fontSize: "4.5cqw", color: colours.accent }}>
            Tapvane
          </span>
          <div className="absolute inset-x-[6cqw] top-1/2 -translate-y-1/2 text-center">
            <p className="truncate font-display" style={{ fontSize: "7.5cqw" }}>
              {shownName}
            </p>
            {subtitle && (
              <p className="mt-[1.5cqw] truncate opacity-70" style={{ fontSize: "3.4cqw" }}>
                {subtitle}
              </p>
            )}
          </div>
          <NfcWaveIcon className="absolute bottom-[5cqw] left-1/2 -translate-x-1/2" style={{ width: "6cqw", height: "6cqw", color: colours.accent }} />
        </>
      ) : (
        <>
          {layout === "monogram" && (
            <span
              className="absolute -right-[2cqw] -top-[6cqw] font-display leading-none"
              style={{ fontSize: "62cqw", color: colours.accent, opacity: 0.14 }}
              aria-hidden="true"
            >
              {name ? initials(name).slice(0, 1) : "T"}
            </span>
          )}
          <span className={`absolute left-[6cqw] top-[6cqw] ${wordmark}`} style={{ fontSize: "5cqw", color: colours.accent }}>
            Tapvane
          </span>
          <NfcWaveIcon className="absolute right-[6cqw] top-[5cqw]" style={{ width: "7cqw", height: "7cqw", color: colours.accent }} />
          <div className="absolute bottom-[6cqw] left-[6cqw] right-[6cqw]">
            <p className="truncate font-display" style={{ fontSize: "6.5cqw" }}>
              {shownName}
            </p>
            {subtitle && (
              <p className="mt-[1cqw] truncate opacity-70" style={{ fontSize: "3.4cqw" }}>
                {subtitle}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
