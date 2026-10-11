import { Suspense } from "react";
import FaqList from "@/components/FaqList";
import { faqAnswer, faqs } from "@/lib/content";
import { getSettings } from "@/lib/site";

export const metadata = {
  title: "FAQ | Tapvane",
  description: "Answers about Tapvane NFC cards, tags, delivery, payment and your digital profile.",
};

// Lets search engines read the questions and answers.
async function FaqSchema() {
  const settings = await getSettings();
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: faqAnswer(f.a, settings) },
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export default function FaqPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="font-display text-4xl text-ivory md:text-5xl">Frequently asked questions</h1>
      <div className="mt-10">
        <Suspense fallback={<div className="h-96 rounded-2xl border border-line-subtle" />}>
          <FaqList />
        </Suspense>
      </div>
      <Suspense fallback={null}>
        <FaqSchema />
      </Suspense>
    </main>
  );
}
