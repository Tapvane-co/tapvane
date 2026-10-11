import { ImageResponse } from "next/og";
import { getProfile, initials } from "@/lib/profiles";

// The picture shown when someone shares a profile link on WhatsApp: name, job title and photo.
export const alt = "Tapvane digital profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await getProfile(username);
  const active = profile && profile.isActive ? profile : null;
  const subtitle = active ? [active.title, active.company].filter(Boolean).join(" · ") : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: "#0B0B0C",
          border: "10px solid #C9A34E",
          padding: "0 90px",
        }}
      >
        {active ? (
          <>
            <div
              style={{
                width: 280,
                height: 280,
                borderRadius: 140,
                border: "6px solid #C9A34E",
                background: "#1C1B19",
                color: "#C9A34E",
                fontSize: 110,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {active.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={active.photoUrl} alt="" width={280} height={280} style={{ objectFit: "cover" }} />
              ) : (
                initials(active.fullName)
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", marginLeft: 70 }}>
              <div style={{ display: "flex", fontSize: 72, color: "#EDE6D6", fontWeight: 700 }}>{active.fullName}</div>
              {subtitle && <div style={{ display: "flex", marginTop: 16, fontSize: 36, color: "#A79F92" }}>{subtitle}</div>}
              <div style={{ display: "flex", marginTop: 48, fontSize: 28, color: "#C9A34E", letterSpacing: 8 }}>TAPVANE</div>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
            <div style={{ display: "flex", fontSize: 96, color: "#C9A34E", letterSpacing: 28, fontWeight: 700 }}>TAPVANE</div>
            <div style={{ display: "flex", marginTop: 36, fontSize: 44, color: "#EDE6D6" }}>Tap. Share. Connect.</div>
          </div>
        )}
      </div>
    ),
    { ...size },
  );
}
