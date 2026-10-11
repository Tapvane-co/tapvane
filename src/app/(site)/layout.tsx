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
      <Suspense fallback={<div className="h-16 border-b border-line-subtle" />}>
        <SiteHeader />
      </Suspense>
      <div className="flex flex-1 flex-col">{children}</div>
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
