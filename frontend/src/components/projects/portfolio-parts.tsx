import type {
  Experience,
  Project,
  SocialLink,
  Technology,
} from "@/types/portfolio";
import { Badge, Card, ExternalLink } from "@/components/ui/primitives";
import Link from "next/link";
import Image from "next/image";
import type { HTMLAttributes, ReactNode } from "react";
import { Reveal } from "@/components/shared/reveal";

export function SectionWrapper({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <section className={`scroll-mt-28 py-16 sm:py-24 ${className}`} {...props}>
      <Reveal>{children}</Reveal>
    </section>
  );
}
export function TechnologyBadge({ technology }: { technology: Technology }) {
  return <Badge>{technology.name}</Badge>;
}
export function ProjectCard({ project }: { project: Project }) {
  return (
    <Reveal>
      <Card className="group hover:border-accent focus-within:border-accent transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div className="bg-subtle border-line relative mb-6 flex aspect-[16/9] items-end overflow-hidden rounded-[var(--radius-sm)] border p-5">
          {project.thumbnail ? (
            <Image
              src={project.thumbnail.src}
              alt={project.thumbnail.alt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <span className="text-muted font-mono text-xs tracking-[.12em] uppercase">
              Hình ảnh đang cập nhật
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-xl font-semibold tracking-tight">
            {project.title}
          </h3>
          {project.placeholder && <Badge>Dữ liệu mẫu</Badge>}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {project.featured && <Badge>Nổi bật</Badge>}
          {project.status && <Badge>{project.status}</Badge>}
        </div>
        <p className="text-muted mt-3 leading-7">{project.summary}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {project.technologies.map((technology) => (
            <TechnologyBadge key={technology.name} technology={technology} />
          ))}
        </div>
        <Link
          href={`/projects/${project.slug}`}
          className="text-accent mt-6 inline-flex min-h-11 items-center font-semibold hover:underline"
        >
          Xem chi tiết{" "}
          <span aria-hidden="true" className="ml-2">
            ↗
          </span>
        </Link>
        {!project.placeholder && (project.repositoryUrl || project.liveUrl) && (
          <div className="mt-6 flex gap-5">
            {project.repositoryUrl && (
              <ExternalLink href={project.repositoryUrl}>Mã nguồn</ExternalLink>
            )}
            {project.liveUrl && (
              <ExternalLink href={project.liveUrl}>Xem dự án</ExternalLink>
            )}
          </div>
        )}
      </Card>
    </Reveal>
  );
}
export function SocialLinkCard({ link }: { link: SocialLink }) {
  if (link.placeholder) return null;
  return (
    <Card>
      <h3 className="mb-3 font-semibold">{link.label}</h3>
      <ExternalLink href={link.url}>Mở liên kết</ExternalLink>
    </Card>
  );
}
export function ExperienceItem({ experience }: { experience: Experience }) {
  return (
    <article className="border-line border-l-2 py-1 pl-5">
      <p className="text-muted font-mono text-xs">
        {experience.startDate} — {experience.endDate ?? "Hiện tại"}
      </p>
      <h3 className="mt-2 font-semibold">{experience.role}</h3>
      <p className="text-muted text-sm">{experience.organization}</p>
      <p className="mt-3 leading-7">{experience.summary}</p>
      {experience.placeholder && <Badge className="mt-3">Dữ liệu mẫu</Badge>}
    </article>
  );
}
