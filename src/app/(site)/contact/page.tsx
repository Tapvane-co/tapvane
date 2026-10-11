import { Suspense } from "react";
import { getSettings, instagramUrl, whatsappLink } from "@/lib/site";

export const metadata = {
  title: "Contact | Tapvane",
  description: "Questions about cards, bulk orders or your profile? Chat with Tapvane on WhatsApp or send an email.",
};

const link = "text-gold underline-offset-4 hover:underline";

// WhatsApp, email, Instagram, hours and pickup address all come from admin Settings.
async function ContactDetails() {
  const s = await getSettings();
  return (
    <ul className="mt-10 flex flex-col gap-4">
      <li className="rounded-2xl border border-gold bg-charcoal p-6">
        <p className="text-sm text-muted">WhatsApp (fastest)</p>
        <p className="mt-1 text-lg text-ivory">{s.whatsappNumber}</p>
        <a
          href={whatsappLink(s.whatsappNumber)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-8 font-semibold text-onyx hover:brightness-110"
        >
          Chat on WhatsApp
        </a>
      </li>
      <li className="rounded-2xl border border-line bg-charcoal p-6">
        <p className="text-sm text-muted">Email</p>
        <a href={`mailto:${s.contactEmail}`} className={`${link} mt-1 inline-flex min-h-11 items-center text-lg`}>
          {s.contactEmail}
        </a>
      </li>
      {s.instagramHandle && (
        <li className="rounded-2xl border border-line bg-charcoal p-6">
          <p className="text-sm text-muted">Instagram</p>
          <a href={instagramUrl(s.instagramHandle)} target="_blank" rel="noopener noreferrer" className={`${link} mt-1 inline-flex min-h-11 items-center text-lg`}>
            {s.instagramHandle.startsWith("@") ? s.instagramHandle : `@${s.instagramHandle}`}
          </a>
        </li>
      )}
      <li className="rounded-2xl border border-line bg-charcoal p-6">
        <p className="text-sm text-muted">Pickup location</p>
        <p className="mt-1 text-lg text-ivory">{s.pickupAddress}</p>
      </li>
      {s.openingHours && (
        <li className="rounded-2xl border border-line bg-charcoal p-6">
          <p className="text-sm text-muted">Hours</p>
          <p className="mt-1 text-lg text-ivory">{s.openingHours}</p>
        </li>
      )}
    </ul>
  );
}

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <h1 className="font-display text-4xl text-ivory md:text-5xl">Talk to us</h1>
      <p className="mt-4 text-muted">Questions about cards, bulk orders or your profile? We&apos;re happy to help.</p>
      <Suspense fallback={<div className="mt-10 h-80 rounded-2xl border border-line-subtle" />}>
        <ContactDetails />
      </Suspense>
    </main>
  );
}
