/** Placeholder content must never be presented as verified personal history. */
export interface Profile {
  name: string;
  headline: string;
  bio: string;
  location?: string;
  placeholder: boolean;
}

export interface Technology {
  name: string;
  category: "language" | "framework" | "database" | "tool";
}

export interface Project {
  slug: string;
  title: string;
  summary: string;
  description: string;
  technologies: Technology[];
  repositoryUrl?: string;
  liveUrl?: string;
  placeholder: boolean;
}

export interface Experience {
  id: string;
  role: string;
  organization: string;
  startDate: string;
  endDate?: string;
  summary: string;
  placeholder: boolean;
}

export interface SocialLink {
  label: string;
  url: string;
  kind: "github" | "linkedin" | "other";
  placeholder: boolean;
}
