import type {
  Experience,
  Project,
  SocialLink,
  Technology,
} from "@/types/portfolio";
import { Badge, Card, ExternalLink } from "@/components/ui/primitives";
import type { HTMLAttributes, ReactNode } from "react";

export function SectionWrapper({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <section className={`scroll-mt-28 py-16 sm:py-24 ${className}`} {...props}>
      {children}
    </section>
  );
}
export function TechnologyBadge({ technology }: { technology: Technology }) {
  return <Badge>{technology.name}</Badge>;
}
export function ProjectCard({ project }: { project: Project }) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-xl font-semibold tracking-tight">
          {project.title}
        </h3>
        {project.placeholder && <Badge>Dữ liệu mẫu</Badge>}
      </div>
      <p className="text-muted mt-3 leading-7">{project.summary}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {project.technologies.map((technology) => (
          <TechnologyBadge key={technology.name} technology={technology} />
        ))}
      </div>
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
