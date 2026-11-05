import type { Metadata } from "next";
import Link from "next/link";
import {
  ProjectCard,
  SectionWrapper,
} from "@/components/projects/portfolio-parts";
import { Container, SectionHeading } from "@/components/ui/primitives";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { getBackendUrl, loadProjects } from "@/lib/portfolio-api";
import { pageMetadata } from "@/lib/seo";
import { filterProjects } from "@/lib/project-filters";

export const metadata: Metadata = pageMetadata(
  "Dự án | DEVFOLIO",
  "Khám phá danh sách dự án, công nghệ và các case study của DEVFOLIO.",
  "/projects",
);

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ technology?: string; category?: string }>;
}) {
  const params = await searchParams;
  let projects;
  try {
    projects = await loadProjects();
  } catch {
    return (
      <main id="main-content">
        <Container className="py-20">
          <ErrorState description="Không thể tải danh sách dự án." />
        </Container>
      </main>
    );
  }
  const technology = params.technology ?? "all";
  const category = params.category ?? "all";
  const technologyOptions = [
    ...new Set(
      projects.flatMap((project) =>
        project.technologies.map((item) => item.name),
      ),
    ),
  ].sort();
  const categoryOptions = [
    ...new Set(
      projects
        .map((project) => project.category)
        .filter((item): item is string => Boolean(item)),
    ),
  ].sort();
  const filtered = filterProjects(projects, technology, category);
  const filterHref = (kind: "technology" | "category", value: string) => {
    const next = new URLSearchParams();
    const tech = kind === "technology" ? value : technology;
    const cat = kind === "category" ? value : category;
    if (tech !== "all") next.set("technology", tech);
    if (cat !== "all") next.set("category", cat);
    return `/projects${next.size ? `?${next}` : ""}`;
  };
  return (
    <main id="main-content">
      <Container>
        <SectionWrapper>
          <SectionHeading
            eyebrow="Projects / Index"
            title="Dự án & ý tưởng"
            description={
              getBackendUrl()
                ? "Các dự án đã xuất bản từ DEVFOLIO API."
                : "Danh sách hiện dùng dữ liệu mẫu để kiểm tra trang và bộ lọc. Nội dung thực tế sẽ được thay thế sau khi xác nhận."
            }
          />
          <div className="border-line mt-10 space-y-5 border-y py-6">
            <div>
              <p className="mb-3 text-sm font-semibold">Công nghệ</p>
              <div className="flex flex-wrap gap-2">
                {["all", ...technologyOptions].map((option) => (
                  <Link
                    key={option}
                    href={filterHref("technology", option)}
                    aria-current={technology === option ? "true" : undefined}
                    className={`hover:border-accent inline-flex min-h-11 items-center rounded-full border px-4 text-sm transition-colors ${technology === option ? "border-accent bg-accent text-[var(--accent-contrast)]" : "border-line bg-surface"}`}
                  >
                    {option === "all" ? "Tất cả" : option}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold">Danh mục</p>
              <div className="flex flex-wrap gap-2">
                {["all", ...categoryOptions].map((option) => (
                  <Link
                    key={option}
                    href={filterHref("category", option)}
                    aria-current={category === option ? "true" : undefined}
                    className={`hover:border-accent inline-flex min-h-11 items-center rounded-full border px-4 text-sm transition-colors ${category === option ? "border-accent bg-accent text-[var(--accent-contrast)]" : "border-line bg-surface"}`}
                  >
                    {option === "all" ? "Tất cả" : option}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <p className="text-muted mt-7 text-sm" role="status">
            {filtered.length} mục phù hợp
          </p>
          {filtered.length ? (
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {filtered.map((project) => (
                <ProjectCard key={project.slug} project={project} />
              ))}
            </div>
          ) : (
            <div className="mt-5 max-w-xl">
              <EmptyState
                title="Không tìm thấy dự án"
                description="Thử chọn bộ lọc khác hoặc xem tất cả dự án."
                action={
                  <Link
                    href="/projects"
                    className="text-accent font-semibold underline-offset-4 hover:underline"
                  >
                    Xóa bộ lọc
                  </Link>
                }
              />
            </div>
          )}
        </SectionWrapper>
      </Container>
    </main>
  );
}
