import type { ReactNode } from "react";
import { Suspense } from "react";
import CartDrawer from "@/components/CartDrawer";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import WhatsAppButton from "@/components/WhatsAppButton";

// The frame around the public website pages: menu on top, footer and WhatsApp button on every page.
// (Digital profiles, login and admin have their own look, so they are outside this group.)
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-gold focus:px-5 focus:py-3 focus:font-semibold focus:text-onyx"
      >
        Skip to content
      </a>
      <Suspense fallback={<div className="h-16 border-b border-line-subtle" />}>
        <SiteHeader />
      </Suspense>
      <div id="main" className="flex flex-1 flex-col">{children}</div>
      <Suspense fallback={null}>
        <SiteFooter />
      </Suspense>
      <Suspense fallback={null}>
        <WhatsAppButton />
      </Suspense>
      <CartDrawer />
    </>
  );
}
