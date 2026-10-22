import { create } from "qrcode";

// A QR code drawn as one vector shape (sharp at any size, light for the browser, prints cleanly).
// It includes its own white "quiet zone" border, which scanners need.
export default function QrCode({
  value,
  dark = "#0B0B0C",
  light = "#F4EFE3",
  className = "",
  style,
}: {
  value: string;
  dark?: string;
  light?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { modules } = create(value, { errorCorrectionLevel: "M" });
  const n = modules.size;
  const quiet = 2; // modules of empty border around the code
  const total = n + quiet * 2;

  let path = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (modules.get(y, x)) path += `M${x + quiet} ${y + quiet}h1v1h-1z`;
    }
  }

  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      className={className}
      style={style}
      shapeRendering="crispEdges"
      role="img"
      aria-label="QR code that opens this card's Tapvane profile"
    >
      <rect width={total} height={total} fill={light} />
      <path d={path} fill={dark} />
    </svg>
  );
}
