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
import { EmptyState, ErrorState } from "@/components/shared/states";
import {
  loadExperiences,
  loadProfile,
  loadTechnologies,
} from "@/lib/portfolio-api";
import { getResumeHref } from "@/lib/resume";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata(
  "Giới thiệu | DEVFOLIO",
  "Tìm hiểu định hướng chuyên môn, nền tảng kỹ thuật và hành trình phát triển của DEVFOLIO.",
  "/about",
);
const groups = ["Backend", "Frontend", "Database", "DevOps", "Tools"] as const;

export default async function AboutPage() {
  let data;
  try {
    data = await Promise.all([
      loadProfile(),
      loadExperiences(),
      loadTechnologies(),
    ]);
  } catch {
    return (
      <main id="main-content">
        <Container className="py-20">
          <ErrorState description="Không thể tải hồ sơ." />
        </Container>
      </main>
    );
  }
  const [profile, experiences, technologies] = data;
  if (!profile)
    return (
      <main id="main-content">
        <Container className="py-20">
          <EmptyState title="Hồ sơ chưa được công bố" />
        </Container>
      </main>
    );
  const candidate = getResumeHref(profile.resumeUrl);
  const resumeHref =
    candidate &&
    (candidate.startsWith("/")
      ? existsSync(join(process.cwd(), "public", candidate.slice(1)))
      : true)
      ? candidate
      : null;
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
            <div className="text-muted max-w-2xl leading-8">
              {profile.interests?.length ? (
                <ul className="list-inside list-disc">
                  {profile.interests.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>TODO: Bổ sung mối quan tâm chuyên môn đã xác nhận.</p>
              )}
            </div>
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
          {profile.skills?.length ? (
            <p className="text-muted mt-6">
              Kỹ năng đã xác nhận: {profile.skills.join(", ")}
            </p>
          ) : null}
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
          {profile.education?.length ? (
            <div className="mt-8 space-y-4">
              {profile.education.map((item) => (
                <div
                  key={`${item.school}-${item.program}`}
                  className="border-line border-l-2 pl-5"
                >
                  <h3 className="font-semibold">{item.program}</h3>
                  <p className="text-muted">
                    {item.school}
                    {item.period ? ` · ${item.period}` : ""}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </SectionWrapper>
        <Divider />
        <SectionWrapper>
          <SectionHeading
            eyebrow="04 / Approach"
            title="Triết lý phát triển"
            description="Chưa có phát biểu cá nhân được xác nhận. Phần này sẽ trình bày cách giải quyết vấn đề và nguyên tắc kỹ thuật khi có nội dung thật."
          />
          <div className="mt-8 max-w-xl">
            {resumeHref ? (
              <a
                href={resumeHref}
                download={resumeHref.startsWith("/") ? true : undefined}
                className="bg-accent inline-flex min-h-11 items-center rounded-[var(--radius-sm)] px-5 text-sm font-semibold text-[var(--accent-contrast)] hover:opacity-85"
              >
                Download CV
              </a>
            ) : (
              <EmptyState
                title="CV chưa được cung cấp"
                description="TODO: Thêm PDF thật vào public và cấu hình resumeUrl để bật tải CV."
              />
            )}
          </div>
        </SectionWrapper>
      </Container>
    </main>
  );
}
