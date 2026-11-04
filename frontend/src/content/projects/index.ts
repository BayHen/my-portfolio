import type { Project, Technology } from "@/types/portfolio";

/** Technology names are development examples, not verified proficiency claims. */
export const technologies: Technology[] = [
  { name: "Python", category: "language", group: "Backend" },
  { name: "FastAPI", category: "framework", group: "Backend" },
  { name: "TypeScript", category: "language", group: "Frontend" },
  { name: "Next.js", category: "framework", group: "Frontend" },
  { name: "PostgreSQL", category: "database", group: "Database" },
  { name: "Docker", category: "tool", group: "DevOps" },
  { name: "Git", category: "tool", group: "Tools" },
];

/** Concept entries exist to exercise routes and filters. No delivery claim is implied. */
export const projects: Project[] = [
  {
    slug: "coffee-shop-management-system",
    title: "Coffee Shop Management System",
    summary: "Ý tưởng mẫu cho hệ thống quản lý cửa hàng cà phê.",
    description:
      "Bản ghi phát triển dùng để thử bố cục case study. Phạm vi, kiến trúc và kết quả cần được xác nhận trước khi công bố.",
    category: "Business application",
    status: "Ý tưởng mẫu",
    featured: true,
    technologies: [technologies[0], technologies[1], technologies[4]],
    placeholder: true,
    // TODO: Add verified problem, goals, architecture, features, responsibilities,
    // challenges, solution, testing, results, and lessons learned.
  },
  {
    slug: "voicemorph-studio",
    title: "VoiceMorph Studio",
    summary: "Ý tưởng mẫu cho một công cụ xử lý giọng nói.",
    description:
      "Bản ghi phát triển dùng để thử tuyến dự án và bộ lọc. Chưa có thông tin xác thực về chức năng hoặc kết quả.",
    category: "Creative tool",
    status: "Ý tưởng mẫu",
    technologies: [technologies[0], technologies[2], technologies[3]],
    placeholder: true,
    // TODO: Replace concept copy with verified case-study details.
  },
];

export function getProjectBySlug(slug: string) {
  return projects.find((project) => project.slug === slug);
}
