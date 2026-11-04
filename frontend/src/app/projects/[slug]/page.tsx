import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Badge,
  Container,
  Divider,
  ExternalLink,
} from "@/components/ui/primitives";
import { TechnologyBadge } from "@/components/projects/portfolio-parts";
import { getProjectBySlug, projects } from "@/content/projects";
import { Reveal } from "@/components/shared/reveal";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const project = getProjectBySlug((await params).slug);
  return project
    ? { title: `${project.title} | DEVFOLIO`, description: project.summary }
    : { title: "Không tìm thấy dự án | DEVFOLIO" };
}

function DetailSection({
  title,
  value,
}: {
  title: string;
  value?: string | string[];
}) {
  if (!value || (Array.isArray(value) && !value.length)) return null;
  return (
    <Reveal>
      <section className="grid gap-4 py-8 sm:grid-cols-[12rem_1fr]">
        <h2 className="text-accent font-mono text-xs font-semibold tracking-[.12em] uppercase">
          {title}
        </h2>
        {Array.isArray(value) ? (
          <ul className="text-ink list-inside list-disc space-y-2 leading-8">
            {value.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-ink max-w-2xl leading-8">{value}</p>
        )}
      </section>
    </Reveal>
  );
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const project = getProjectBySlug((await params).slug);
  if (!project) notFound();
  return (
    <main id="main-content">
      <Container>
        <article className="py-14 sm:py-20">
          <Link
            href="/projects"
            className="text-accent inline-flex min-h-11 items-center text-sm font-semibold hover:underline"
          >
            ← Tất cả dự án
          </Link>
          <div className="mt-10 max-w-4xl">
            <div className="flex flex-wrap gap-2">
              <Badge>{project.status ?? "Trạng thái chưa cập nhật"}</Badge>
              {project.placeholder && <Badge>Dữ liệu mẫu</Badge>}
              {project.featured && <Badge>Nổi bật</Badge>}
            </div>
            <h1 className="mt-6 text-[clamp(2.8rem,7vw,6rem)] leading-[1.04] font-semibold tracking-[-.065em] break-words">
              {project.title}
            </h1>
            <p className="text-muted mt-6 max-w-2xl text-lg leading-8">
              {project.summary}
            </p>
          </div>
          <div className="border-line bg-subtle relative mt-12 flex aspect-[16/8] items-end overflow-hidden rounded-[var(--radius-md)] border p-6">
            {project.thumbnail ? (
              <Image
                src={project.thumbnail.src}
                alt={project.thumbnail.alt}
                fill
                sizes="(max-width: 1200px) 100vw, 1200px"
                className="object-cover"
              />
            ) : (
              <p className="text-muted font-mono text-xs tracking-[.12em] uppercase">
                Hình ảnh dự án đang cập nhật
              </p>
            )}
          </div>
          <div className="mt-10 max-w-4xl">
            <DetailSection title="Tổng quan" value={project.description} />
            <Divider />
            <DetailSection title="Vấn đề" value={project.problem} />
            <DetailSection title="Mục tiêu" value={project.goals} />
            <DetailSection title="Giải pháp" value={project.solution} />
            <DetailSection title="Vai trò" value={project.responsibilities} />
            <DetailSection title="Kiến trúc" value={project.architecture} />
            <DetailSection title="Tính năng" value={project.features} />
            <DetailSection title="Thách thức" value={project.challenges} />
            <DetailSection title="Kiểm thử" value={project.testing} />
            <DetailSection title="Kết quả" value={project.results} />
            <DetailSection title="Bài học" value={project.lessonsLearned} />
            <section className="grid gap-4 py-8 sm:grid-cols-[12rem_1fr]">
              <h2 className="text-accent font-mono text-xs font-semibold tracking-[.12em] uppercase">
                Công nghệ
              </h2>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((item) => (
                  <TechnologyBadge key={item.name} technology={item} />
                ))}
              </div>
            </section>
            {project.screenshots?.length ? (
              <section className="py-8">
                <h2 className="text-accent mb-6 font-mono text-xs font-semibold tracking-[.12em] uppercase">
                  Ảnh chụp
                </h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  {project.screenshots.map((image) => (
                    <div
                      key={image.src}
                      className="border-line relative aspect-video overflow-hidden rounded-lg border"
                    >
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        sizes="(max-width: 640px) 100vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
            {(project.repositoryUrl || project.liveUrl) && (
              <div className="flex flex-wrap gap-6 py-8">
                {project.repositoryUrl && (
                  <ExternalLink href={project.repositoryUrl}>
                    GitHub repository
                  </ExternalLink>
                )}
                {project.liveUrl && (
                  <ExternalLink href={project.liveUrl}>Live demo</ExternalLink>
                )}
              </div>
            )}
          </div>
        </article>
      </Container>
    </main>
  );
}
