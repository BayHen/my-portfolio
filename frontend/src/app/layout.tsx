import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/components/layout/theme-provider";
import "@/styles/globals.css";
import { pageMetadata } from "@/lib/seo";
import { loadSocialLinks } from "@/lib/portfolio-api";

export const metadata: Metadata = pageMetadata(
  "DEVFOLIO | Python Backend / Full-stack",
  "Portfolio DEVFOLIO: giới thiệu, dự án và thông tin liên hệ của lập trình viên Python Backend / Full-stack.",
  "/",
);

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  let links = [] as Awaited<ReturnType<typeof loadSocialLinks>>;
  try {
    links = await loadSocialLinks();
  } catch {
    /* Keep the shell available if the API is down. */
  }
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <noscript>
          <style>
            {".reveal{opacity:1!important;transform:none!important}"}
          </style>
        </noscript>
        <ThemeProvider>
          <a href="#main-content" className="skip-link">
            Bỏ qua điều hướng
          </a>
          <Header />
          {children}
          <Footer links={links} />
        </ThemeProvider>
      </body>
    </html>
  );
}
