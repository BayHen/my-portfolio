"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { SocialLink } from "@/types/portfolio";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export function SiteChrome({
  children,
  links,
}: {
  children: ReactNode;
  links: SocialLink[];
}) {
  const admin = usePathname().startsWith("/admin");
  return (
    <>
      {!admin && <Header />}
      {children}
      {!admin && <Footer links={links} />}
    </>
  );
}
