import { ImageResponse } from "next/og";

// The small icon in the browser tab: a gold "T" on Onyx. (Replace with the final logo later.)
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 44,
          fontWeight: 700,
          border: "3px solid #C9A34E",
          borderRadius: 14,
        }}
      >
        T
      </div>
    ),
    { ...size },
  );
}
