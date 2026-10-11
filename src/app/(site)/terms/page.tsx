import { Suspense } from "react";
import LegalPage, { type LegalSection } from "@/components/LegalPage";
import { LEGAL_UPDATED } from "@/lib/legal";
import { getSettings } from "@/lib/site";

export const metadata = {
  title: "Terms of Service | Tapvane",
  description: "The terms for using the Tapvane website, buying Tapvane cards and tags, and using a Tapvane digital profile.",
};

// CONTENT.md section 12. The business name, email and WhatsApp number come from admin Settings.
async function Terms() {
  const s = await getSettings();
  const sections: LegalSection[] = [
    {
      title: "About us",
      body: `Tapvane (“we”, “us”) is ${s.legalName ? `${s.legalName}, ` : ""}based in Makurdi, Benue State, Nigeria. These terms apply when you use our website, buy our products, or use a Tapvane digital profile.`,
    },
    {
      title: "Products",
      body: "We sell NFC business cards and tags linked to a Tapvane digital profile. Card designs are made from your choices in the customiser; small colour differences between screen and print may occur.",
    },
    {
      title: "Accounts",
      body: "You must give accurate information and keep your password safe. You are responsible for all activity on your account.",
    },
    {
      title: "Your profile content",
      body: "You own the content you add to your profile. You must not add content that is illegal, misleading, offensive, or that infringes someone else's rights. We may disable profiles that break these rules.",
    },
    {
      title: "Orders and payment",
      body: "Prices are in Naira and shown at checkout. Orders begin production only after payment is confirmed. Online payments are processed by Paystack.",
    },
    {
      title: "Delivery",
      body: "Orders are usually ready within 5–7 business days after payment is confirmed. Delivery times are estimates. Risk passes to you on delivery or pickup. Please check your card on arrival.",
    },
    {
      title: "Lost cards",
      body: "If you lose your card, contact us and we'll deactivate it and link a replacement card to your profile at no extra charge.",
    },
    {
      title: "Service availability",
      body: "We aim to keep profiles online at all times but can't guarantee uninterrupted service.",
    },
    {
      title: "Limitation of liability",
      body: "To the extent allowed by law, our liability is limited to the amount you paid for the product.",
    },
    {
      title: "Changes",
      body: "We may update these terms. We'll post the new version on this page with the updated date.",
    },
    {
      title: "Governing law",
      body: "These terms are governed by the laws of the Federal Republic of Nigeria.",
    },
    {
      title: "Contact",
      body: `Email: ${s.contactEmail} · WhatsApp: ${s.whatsappNumber}`,
    },
  ];
  return <LegalPage title="Terms of Service" updated={LEGAL_UPDATED} sections={sections} />;
}

export default function TermsPage() {
  return (
    <Suspense fallback={<main className="flex-1" />}>
      <Terms />
    </Suspense>
  );
}
