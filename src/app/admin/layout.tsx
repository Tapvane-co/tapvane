import type { ReactNode } from "react";
import AdminShell from "@/components/AdminShell";

export const metadata = {
  title: "Admin | Tapvane",
  robots: { index: false, follow: false },
};

// Admin pages only appear after the admin check, so they can't be pre-rendered for instant navigation.
export const instant = false;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
