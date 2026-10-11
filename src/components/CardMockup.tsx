// The Tapvane card, drawn in code (PRD section 8). Used on the website now and in the card designer later.
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

export default function CardMockup({
  side = "front",
  name = "Amaka Obi",
  title = "Brand Designer",
  company = "Obi Studio",
  className = "",
}: {
  side?: "front" | "back";
  name?: string;
  title?: string;
  company?: string;
  className?: string;
}) {
  const subtitle = [title, company].filter(Boolean).join(" · ");

  if (side === "back") {
    return (
      <div
        className={`relative aspect-[1.586] w-full overflow-hidden rounded-[4.5%/7%] bg-gold shadow-2xl shadow-black/50 ${className}`}
        style={{ containerType: "inline-size" }}
        role="img"
        aria-label="Back of a Tapvane card"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/15" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-onyx">
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

  return (
    <div
      className={`relative aspect-[1.586] w-full overflow-hidden rounded-[4.5%/7%] border border-line bg-onyx shadow-2xl shadow-black/60 ${className}`}
      style={{ containerType: "inline-size" }}
      role="img"
      aria-label={`Tapvane card for ${name}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gold/20 via-transparent to-transparent" />
      <span
        className="absolute left-[6cqw] top-[6cqw] font-display uppercase tracking-[0.3em] text-gold"
        style={{ fontSize: "5cqw" }}
      >
        Tapvane
      </span>
      <NfcWaveIcon className="absolute right-[6cqw] top-[5cqw] text-gold" style={{ width: "7cqw", height: "7cqw" }} />
      <div className="absolute bottom-[6cqw] left-[6cqw] right-[6cqw]">
        <p className="truncate font-display text-ivory" style={{ fontSize: "7cqw" }}>
          {name || "Your name"}
        </p>
        {subtitle && (
          <p className="mt-[1cqw] truncate text-muted" style={{ fontSize: "3.4cqw" }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
