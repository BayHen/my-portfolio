import type { Metadata } from "next";
import { Container, SectionHeading } from "@/components/ui/primitives";
import {
  SectionWrapper,
  SocialLinkCard,
} from "@/components/projects/portfolio-parts";
import { ContactForm } from "@/components/contact/contact-form";
import { loadProfile, loadSocialLinks } from "@/lib/portfolio-api";
import { getBackendUrl } from "@/lib/portfolio-api";
import { getContactConfig } from "@/lib/contact";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMetadata(
  "Liên hệ | DEVFOLIO",
  "Liên hệ với chủ sở hữu DEVFOLIO qua các kênh công khai hoặc biểu mẫu khi dịch vụ email được cấu hình.",
  "/contact",
);
export default async function ContactPage() {
  let profile = null;
  let publicLinks = [] as Awaited<ReturnType<typeof loadSocialLinks>>;
  try {
    [profile, publicLinks] = await Promise.all([
      loadProfile(),
      loadSocialLinks(),
    ]);
  } catch {
    /* Contact form stays available even if public profile API is down. */
  }
  const configured = getBackendUrl()
    ? !!process.env.BACKEND_CONTACT_PROXY_TOKEN
    : !!getContactConfig(process.env);
  return (
    <main id="main-content">
      <Container>
        <SectionWrapper>
          <SectionHeading
            eyebrow="Contact"
            title="Bắt đầu cuộc trò chuyện."
            description="Gửi lời nhắn khi dịch vụ email đã được cấu hình, hoặc dùng kênh liên hệ công khai bên dưới."
          />
          <div className="mt-12 grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <h2 className="text-lg font-semibold">Kênh liên hệ</h2>
              {profile?.publicEmail && (
                <a
                  href={`mailto:${profile.publicEmail}`}
                  className="text-accent mt-4 inline-block underline-offset-4 hover:underline"
                >
                  {profile.publicEmail}
                </a>
              )}
              {publicLinks.length ? (
                <div className="mt-5 grid gap-4">
                  {publicLinks.map((link) => (
                    <SocialLinkCard key={link.url} link={link} />
                  ))}
                </div>
              ) : (
                !profile?.publicEmail && (
                  <p className="text-muted mt-4 max-w-sm leading-7">
                    TODO: Thêm email hoặc liên kết xã hội công khai đã xác nhận.
                  </p>
                )
              )}
            </div>
            <div className="border-line bg-surface rounded-[var(--radius-md)] border p-6 sm:p-8">
              <h2 className="text-lg font-semibold">Biểu mẫu liên hệ</h2>
              <ContactForm configured={configured} />
            </div>
          </div>
        </SectionWrapper>
      </Container>
    </main>
  );
}
