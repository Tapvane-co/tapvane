import { ImageResponse } from "next/og";

// The icon used when someone saves the site to their phone's home screen.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B0B0C",
          color: "#C9A34E",
          fontSize: 120,
          fontWeight: 700,
          border: "6px solid #C9A34E",
        }}
      >
        T
      </div>
    ),
    { ...size },
  );
}
