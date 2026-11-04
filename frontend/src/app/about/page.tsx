import type { Metadata } from "next";
import {
  Container,
  Divider,
  SectionHeading,
  Badge,
} from "@/components/ui/primitives";
import {
  ExperienceItem,
  SectionWrapper,
  TechnologyBadge,
} from "@/components/projects/portfolio-parts";
import { EmptyState } from "@/components/shared/states";
import { experiences, profile } from "@/content/profile";
import { technologies } from "@/content/projects";

export const metadata: Metadata = {
  title: "About | DEVFOLIO",
  description: "Thông tin giới thiệu và định hướng chuyên môn của DEVFOLIO.",
};
const groups = ["Backend", "Frontend", "Database", "DevOps", "Tools"] as const;

export default function AboutPage() {
  return (
    <main id="main-content">
      <Container>
        <SectionWrapper>
          <Badge>
            {profile.placeholder ? "Hồ sơ mẫu — cần xác nhận" : "Hồ sơ"}
          </Badge>
          <h1 className="mt-8 max-w-4xl text-[clamp(3rem,7vw,6.5rem)] leading-[1.04] font-semibold tracking-[-.065em]">
            Về người xây dựng.
          </h1>
          <p className="text-muted mt-7 max-w-2xl text-lg leading-8">
            {profile.bio}
          </p>
        </SectionWrapper>
        <Divider />
        <SectionWrapper>
          <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
            <SectionHeading
              eyebrow="01 / Direction"
              title="Mối quan tâm chuyên môn"
            />
            <p className="text-muted max-w-2xl leading-8">
              Định hướng đã khai báo của portfolio là Python Backend /
              Full-stack. Các lĩnh vực quan tâm cụ thể sẽ được cập nhật sau khi
              chủ sở hữu cung cấp nội dung.
            </p>
          </div>
        </SectionWrapper>
        <Divider />
        <SectionWrapper>
          <SectionHeading
            eyebrow="02 / Technical background"
            title="Nền tảng kỹ thuật & kỹ năng"
            description="Các mục công nghệ hiện chỉ là dữ liệu minh họa, không xác nhận kinh nghiệm hay trình độ."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <div
                key={group}
                className="border-line bg-surface rounded-[var(--radius-md)] border p-6"
              >
                <h3 className="mb-5 font-semibold">{group}</h3>
                <div className="flex flex-wrap gap-2">
                  {technologies
                    .filter((item) => item.group === group)
                    .map((item) => (
                      <TechnologyBadge key={item.name} technology={item} />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </SectionWrapper>
        <Divider />
        <SectionWrapper>
          <SectionHeading
            eyebrow="03 / Journey"
            title="Kinh nghiệm & hành trình học tập"
          />
          {experiences.length ? (
            <div className="mt-8 space-y-8">
              {experiences.map((item) => (
                <ExperienceItem key={item.id} experience={item} />
              ))}
            </div>
          ) : (
            <div className="mt-8 max-w-xl">
              <EmptyState
                title="Chưa có dữ liệu kinh nghiệm"
                description="Lịch sử làm việc hoặc hành trình học tập sẽ được bổ sung khi có thông tin xác thực."
              />
            </div>
          )}
        </SectionWrapper>
        <Divider />
        <SectionWrapper>
          <SectionHeading
            eyebrow="04 / Approach"
            title="Triết lý phát triển"
            description="Chưa có phát biểu cá nhân được xác nhận. Phần này sẽ trình bày cách giải quyết vấn đề và nguyên tắc kỹ thuật khi có nội dung thật."
          />
          <div className="mt-8 max-w-xl">
            <EmptyState
              title="CV chưa được cung cấp"
              description="Liên kết tải CV sẽ chỉ xuất hiện sau khi có tài liệu hợp lệ."
            />
          </div>
        </SectionWrapper>
      </Container>
    </main>
  );
}
