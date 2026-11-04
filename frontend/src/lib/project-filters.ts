import type { Project } from "@/types/portfolio";

export function filterProjects(
  projects: Project[],
  technology: string,
  category: string,
): Project[] {
  return projects.filter(
    (project) =>
      (technology === "all" ||
        project.technologies.some((item) => item.name === technology)) &&
      (category === "all" || project.category === category),
  );
}
