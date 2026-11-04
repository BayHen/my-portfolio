import type { Project, Technology } from "@/types/portfolio";

export const technologies: Technology[] = [
  { name: "Python", category: "language" },
  { name: "FastAPI", category: "framework" },
  { name: "PostgreSQL", category: "database" },
];

export const projects: Project[] = [
  {
    slug: "sample-project",
    title: "Dự án mẫu — chưa xác thực",
    summary: "Bản ghi mẫu để phát triển cấu trúc dữ liệu.",
    description: "Thay thế bằng case study có thật trước khi xuất bản.",
    technologies,
    placeholder: true,
  },
];
