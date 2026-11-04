import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/components/layout/theme-provider";
import "@/styles/globals.css";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata(
  "DEVFOLIO | Python Backend / Full-stack",
  "Portfolio DEVFOLIO: giới thiệu, dự án và thông tin liên hệ của lập trình viên Python Backend / Full-stack.",
  "/",
);

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
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
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
