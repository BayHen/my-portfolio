import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import {
  ProjectCard,
  SectionWrapper,
  TechnologyBadge,
} from "@/components/projects/portfolio-parts";
import {
  ActionLink,
  Badge,
  Container,
  Divider,
  SectionHeading,
} from "@/components/ui/primitives";
import { Reveal } from "@/components/shared/reveal";
import { PortfolioImage } from "@/components/shared/portfolio-image";
import {
  loadMediaAssignments,
  loadProfile,
  loadProjects,
  loadTechnologies,
} from "@/lib/portfolio-api";
import { ErrorState } from "@/components/shared/states";

const groups = ["Backend", "Frontend", "Database", "DevOps", "Tools"] as const;

export default async function HomePage() {
  let data;
  try {
    data = await Promise.all([
      loadProfile(),
      loadProjects(true),
      loadTechnologies(),
      loadMediaAssignments(),
    ]);
  } catch {
    return (
      <main id="main-content">
        <Container className="py-20">
          <ErrorState description="Không thể tải nội dung portfolio. Vui lòng thử lại sau." />
        </Container>
      </main>
    );
  }
  const [profile, projects, technologies, media] = data;
  const avatar = media.find((item) => item.slot === "hero_avatar")?.asset;
  const background = media.find(
    (item) => item.slot === "hero_background",
  )?.asset;
  return (
    <main id="main-content">
      <Container>
        <section className="border-line relative overflow-hidden border-b py-20 sm:py-28 lg:py-36">
          {background && (
            <div
              className="pointer-events-none absolute inset-0 opacity-[.08]"
              aria-hidden="true"
            >
              <PortfolioImage
                src={background.url}
                alt=""
                sizes="100vw"
                fallback={null}
              />
            </div>
          )}
          <div className="relative max-w-4xl">
            <div className="mb-7 flex items-center justify-between gap-5">
              <Reveal hero>
                <p className="text-accent font-mono text-xs font-semibold tracking-[.18em] uppercase">
                  {!profile || profile.placeholder
                    ? "Giới thiệu mẫu / Đang cập nhật"
                    : profile.name}
                </p>
              </Reveal>
              <div className="border-line bg-subtle relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border font-mono text-lg font-semibold sm:size-24">
                <PortfolioImage
                  src={avatar?.url}
                  alt={avatar?.alt || "Ảnh đại diện"}
                  sizes="96px"
                  fallback={<span aria-label="Chưa có ảnh đại diện">DF.</span>}
                />
              </div>
            </div>
            <Reveal hero delay={0.08}>
              <h1 className="text-[clamp(3rem,8vw,7.2rem)] leading-[1.02] font-semibold tracking-[-.075em]">
                Xây dựng sản phẩm từ{" "}
                <span className="text-accent">nền tảng vững.</span>
              </h1>
            </Reveal>
            <Reveal hero delay={0.16}>
              <p className="text-muted mt-8 max-w-2xl text-base leading-8 sm:text-lg">
                {profile?.headline || "Python Backend / Full-stack Developer"}.{" "}
                {profile?.bio || "Nội dung đang cập nhật."}
              </p>
            </Reveal>
            <Reveal hero delay={0.24}>
              <div className="mt-9 flex flex-wrap gap-3">
                <ActionLink href="/projects">
                  Xem dự án <ArrowDownRight size={18} aria-hidden="true" />
                </ActionLink>
                <ActionLink href="/contact" variant="secondary">
                  Liên hệ <ArrowUpRight size={18} aria-hidden="true" />
                </ActionLink>
              </div>
            </Reveal>
          </div>
        </section>
        <SectionWrapper>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
            <SectionHeading
              eyebrow="01 / Selected work"
              title="Dự án nổi bật"
              description="Các mục dưới đây là dữ liệu phát triển, chưa phải sản phẩm hay thành tựu đã xác thực."
            />
            <ActionLink href="/projects" variant="quiet">
              Tất cả dự án <ArrowUpRight size={17} aria-hidden="true" />
            </ActionLink>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {projects
              .filter((project) => project.featured)
              .map((project) => (
                <ProjectCard key={project.slug} project={project} />
              ))}
          </div>
        </SectionWrapper>
        <Divider />
        <SectionWrapper>
          <SectionHeading
            eyebrow="02 / Stack"
            title="Công nghệ theo lĩnh vực"
            description="Danh sách minh họa cho cách tổ chức nội dung; không thể hiện mức độ thành thạo đã được xác nhận."
          />
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {groups.map((group) => (
              <div
                key={group}
                className="border-line bg-surface min-w-0 rounded-[var(--radius-md)] border p-5"
              >
                <h3 className="mb-5 text-sm font-semibold">{group}</h3>
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
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <SectionHeading
              eyebrow="03 / About"
              title="Tìm hiểu cách tiếp cận."
              description="Thông tin nền tảng, sở thích kỹ thuật và hành trình phát triển sẽ được cập nhật sau khi xác nhận."
            />
            <div className="flex flex-col items-start justify-center gap-5">
              <Badge>Hồ sơ đang cập nhật</Badge>
              <ActionLink href="/about" variant="secondary">
                Về portfolio này <ArrowUpRight size={17} aria-hidden="true" />
              </ActionLink>
            </div>
          </div>
        </SectionWrapper>
      </Container>
    </main>
  );
}
