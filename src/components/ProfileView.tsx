import Link from "next/link";
import { ProfileIconButton } from "@/components/ProfileIconButton";
import ShareButton from "@/components/ShareButton";
import { icons } from "@/components/icons";
import { initials, mapsUrl, socialUrl, type Profile } from "@/lib/profiles";

function buttonsFor(p: Profile) {
  const items: { label: string; href: string; icon: React.ReactNode }[] = [];
  if (p.phone) items.push({ label: "Call", href: `tel:${p.phone}`, icon: icons.call });
  if (p.whatsapp) items.push({ label: "WhatsApp", href: `https://wa.me/${p.whatsapp.replace(/\D/g, "")}`, icon: icons.whatsapp });
  if (p.email) items.push({ label: "Email", href: `mailto:${p.email}`, icon: icons.email });
  if (p.instagram) items.push({ label: "Instagram", href: socialUrl("instagram", p.instagram), icon: icons.instagram });
  if (p.website) items.push({ label: "Website", href: p.website, icon: icons.website });
  if (p.linkedin) items.push({ label: "LinkedIn", href: socialUrl("linkedin", p.linkedin), icon: icons.linkedin });
  if (p.location) items.push({ label: "Location", href: mapsUrl(p.location), icon: icons.location });
  const extras = [
    ["x", "X"],
    ["tiktok", "TikTok"],
    ["facebook", "Facebook"],
    ["snapchat", "Snapchat"],
  ] as const;
  for (const [key, label] of extras) {
    const v = p[key];
    if (v) items.push({ label, href: socialUrl(key, v), icon: icons[key] });
  }
  return items;
}

// The "Cover & icons" profile layout (PRD 7.5). `preview` is used in the dashboard:
// buttons look the same but nothing can be clicked.
export default function ProfileView({ profile, preview = false }: { profile: Profile; preview?: boolean }) {
  const items = buttonsFor(profile);
  const subtitle = [profile.title, profile.company].filter(Boolean).join(" · ");
  const name = profile.fullName || "Your name";

  return (
    <div className={`mx-auto flex w-full max-w-md flex-1 flex-col bg-onyx ${preview ? "pointer-events-none select-none" : ""}`}>
      <div
        className="relative h-[150px] border-b border-gold bg-charcoal bg-cover bg-center"
        style={profile.coverUrl ? { backgroundImage: `url(${profile.coverUrl})` } : undefined}
      >
        <span className="absolute left-6 top-5 font-display text-xs uppercase tracking-[0.3em] text-gold">
          Tapvane
        </span>
      </div>

      <div className="flex flex-1 flex-col px-6 pb-8">
        <div className="relative -mt-12 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-[3px] border-onyx bg-charcoal outline outline-1 outline-gold">
          {profile.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photoUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <span className="font-display text-3xl text-gold">{initials(name)}</span>
          )}
        </div>

        <h1 className="mt-4 font-display text-[26px] leading-tight text-ivory">{name}</h1>
        {subtitle && <p className="mt-1 text-[13px] text-muted">{subtitle}</p>}
        {profile.bio && <p className="mt-3 line-clamp-2 text-[13px] text-muted">{profile.bio}</p>}

        <div className="mt-8 grid grid-cols-4 gap-y-5">
          {items.map((b) => (
            <ProfileIconButton key={b.label} label={b.label} href={b.href}>
              {b.icon}
            </ProfileIconButton>
          ))}
          <ShareButton name={name} />
        </div>

        <div className="mt-auto pt-10">
          <a
            href={`/p/${profile.username}/vcard`}
            className="flex min-h-12 w-full items-center justify-center rounded-full bg-gold px-6 font-semibold text-onyx"
          >
            Save Contact
          </a>
          <p className="mt-6 text-center text-xs text-stone">
            <Link href="/" prefetch={false} className="underline-offset-4 hover:underline">
              Get your own Tapvane card
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
