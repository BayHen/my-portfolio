import Link from "next/link";
import { navigation } from "@/config/navigation";
import { socialLinks } from "@/content/profile";
import type { SocialLink } from "@/types/portfolio";
import { Container, Divider, ExternalLink } from "@/components/ui/primitives";

export function Footer({ links = socialLinks }: { links?: SocialLink[] }) {
  const publicLinks = links.filter((link) => !link.placeholder);
  return (
    <footer className="border-line bg-surface mt-24 border-t">
      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto] lg:gap-20">
          <div>
            <Link href="/" className="text-lg font-bold tracking-[-.06em]">
              DEVFOLIO<span className="text-accent">.</span>
            </Link>
            <p className="text-muted mt-4 max-w-xs text-sm leading-6">
              Không gian giới thiệu công việc của một lập trình viên Python
              Backend / Full-stack. Nội dung cá nhân sẽ được xác nhận trước khi
              công bố.
            </p>
          </div>
          <nav aria-label="Điều hướng chân trang">
            <p className="text-muted mb-4 text-xs font-semibold tracking-[.14em] uppercase">
              Khám phá
            </p>
            <ul className="space-y-3">
              {navigation.map((item) => (
                <li key={item.section}>
                  <Link
                    className="text-ink hover:text-accent text-sm"
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="text-muted mb-4 text-xs font-semibold tracking-[.14em] uppercase">
              Kết nối
            </p>
            {publicLinks.length ? (
              <ul className="space-y-3">
                {publicLinks.map((link) => (
                  <li key={link.url}>
                    <ExternalLink href={link.url}>{link.label}</ExternalLink>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted max-w-48 text-sm leading-6">
                Liên kết sẽ xuất hiện khi được xác nhận.
              </p>
            )}
          </div>
        </div>
        <Divider className="my-10" />
        <p className="text-muted text-sm">
          © {new Date().getFullYear()} DEVFOLIO
        </p>
      </Container>
    </footer>
  );
}
