import type { Metadata } from "next";
import {
  Container,
  Input,
  SectionHeading,
  Textarea,
} from "@/components/ui/primitives";
import {
  SectionWrapper,
  SocialLinkCard,
} from "@/components/projects/portfolio-parts";
import { socialLinks } from "@/content/profile";

export const metadata: Metadata = {
  title: "Contact | DEVFOLIO",
  description: "Thông tin liên hệ DEVFOLIO.",
};
const publicLinks = socialLinks.filter((link) => !link.placeholder);

export default function ContactPage() {
  return (
    <main id="main-content">
      <Container>
        <SectionWrapper>
          <SectionHeading
            eyebrow="Contact"
            title="Bắt đầu cuộc trò chuyện."
            description="Kênh liên hệ công khai chưa được cung cấp. Khi có địa chỉ email hoặc liên kết đã xác thực, thông tin sẽ xuất hiện tại đây."
          />
          <div className="mt-12 grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <h2 className="text-lg font-semibold">Kênh liên hệ</h2>
              {publicLinks.length ? (
                <div className="mt-5 grid gap-4">
                  {publicLinks.map((link) => (
                    <SocialLinkCard key={link.url} link={link} />
                  ))}
                </div>
              ) : (
                <p className="text-muted mt-4 max-w-sm leading-7">
                  Chưa có email hoặc tài khoản mạng xã hội công khai được xác
                  nhận.
                </p>
              )}
            </div>
            <div className="border-line bg-surface rounded-[var(--radius-md)] border p-6 sm:p-8">
              <h2 className="text-lg font-semibold">Biểu mẫu liên hệ</h2>
              <p
                id="form-unavailable"
                className="text-muted mt-3 text-sm leading-6"
              >
                Biểu mẫu đang ở chế độ xem trước. Chức năng gửi sẽ được kết nối
                ở Giai đoạn 4.
              </p>
              <form aria-describedby="form-unavailable" className="mt-7">
                <fieldset disabled className="space-y-5">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Tên
                    </label>
                    <Input
                      id="contact-name"
                      name="name"
                      autoComplete="name"
                      placeholder="Tên của bạn"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Email
                    </label>
                    <Input
                      id="contact-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-message"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Lời nhắn
                    </label>
                    <Textarea
                      id="contact-message"
                      name="message"
                      rows={5}
                      placeholder="Nội dung bạn muốn trao đổi"
                    />
                  </div>
                  <p className="text-muted text-sm">Chưa thể gửi tin nhắn.</p>
                </fieldset>
              </form>
            </div>
          </div>
        </SectionWrapper>
      </Container>
    </main>
  );
}
