import { Suspense } from "react";
import LegalPage, { type LegalSection } from "@/components/LegalPage";
import { LEGAL_UPDATED } from "@/lib/legal";
import { getSettings } from "@/lib/site";

export const metadata = {
  title: "Privacy Policy | Tapvane",
  description: "What personal information Tapvane collects, how it is used, who it is shared with, and your rights.",
};

// CONTENT.md section 13, written with the Nigeria Data Protection Act 2023 in mind.
// The business name, email and WhatsApp number come from admin Settings.
async function Privacy() {
  const s = await getSettings();
  const sections: LegalSection[] = [
    {
      title: "Who we are",
      body: `Tapvane${s.legalName ? ` (${s.legalName})` : ""}, Makurdi, Benue State, Nigeria, is responsible for the personal data described here. Contact: ${s.contactEmail} or WhatsApp ${s.whatsappNumber}.`,
    },
    {
      title: "What we collect",
      bullets: [
        <span key="a"><strong className="text-ivory">Account data:</strong> name, email address, password (stored securely, never in plain text).</span>,
        <span key="b"><strong className="text-ivory">Order data:</strong> phone number, delivery address, order details, payment status and receipts you upload. Card payments are handled by Paystack; we don&apos;t store your card details.</span>,
        <span key="c"><strong className="text-ivory">Profile data:</strong> whatever you choose to add: photo, job title, phone, WhatsApp, email, socials, location, bio.</span>,
      ],
    },
    {
      title: "Public profile",
      body: (
        <>
          Information you add to your profile is <strong className="text-ivory">public</strong> to anyone who taps your card or opens your profile link. Only add what you&apos;re happy to share.
        </>
      ),
    },
    {
      title: "How we use your data",
      body: "To process and deliver orders, run your account and profile, send order and account emails, provide support, and improve our service. We don't sell your data.",
    },
    {
      title: "Who we share it with",
      body: "Only service providers we need to run Tapvane: payment processing (Paystack), hosting and database (e.g. Vercel, Supabase), email delivery, and delivery partners (name, phone and address only). They may process data outside Nigeria with appropriate safeguards.",
    },
    {
      title: "How long we keep it",
      body: "Account and profile data: while your account is active. Order records: as required for accounting and legal purposes, for example 6 years.",
    },
    {
      title: "Your rights",
      body: `You can access, correct, download or delete your data, and withdraw consent at any time. Edit your profile from your dashboard, delete your account yourself from your dashboard, or contact ${s.contactEmail} for help. When you delete your account, your profile and login are removed; order records are kept as described above.`,
    },
    {
      title: "Security",
      body: "We use secure login, encrypted connections (HTTPS), and access controls to protect your data.",
    },
    {
      title: "Cookies",
      body: "We use essential cookies to keep you logged in, and we keep your cart in your browser's storage on your device.",
    },
    {
      title: "Changes",
      body: "We'll post updates on this page with a new date.",
    },
    {
      title: "Complaints",
      body: `Contact us first at ${s.contactEmail} or on WhatsApp at ${s.whatsappNumber}. You may also contact the Nigeria Data Protection Commission (NDPC).`,
    },
  ];
  return <LegalPage title="Privacy Policy" updated={LEGAL_UPDATED} sections={sections} />;
}

export default function PrivacyPage() {
  return (
    <Suspense fallback={<main className="flex-1" />}>
      <Privacy />
    </Suspense>
  );
}
