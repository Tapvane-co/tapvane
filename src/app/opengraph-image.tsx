import { ImageResponse } from "next/og";

// The picture that appears when a Tapvane page is shared on WhatsApp, Facebook, X and so on.
export const alt = "Tapvane: Tap. Share. Connect.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B0B0C",
          border: "10px solid #C9A34E",
        }}
      >
        <div style={{ display: "flex", fontSize: 96, color: "#C9A34E", letterSpacing: 28, fontWeight: 700 }}>TAPVANE</div>
        <div style={{ display: "flex", marginTop: 36, fontSize: 44, color: "#EDE6D6" }}>Tap. Share. Connect.</div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 28, color: "#A79F92" }}>
          The smart business card for Nigerian professionals and businesses
        </div>
      </div>
    ),
    { ...size },
  );
}
