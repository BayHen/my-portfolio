import type {
  Experience,
  Profile,
  Project,
  SocialLink,
  Technology,
} from "@/types/portfolio";
import {
  experiences as localExperiences,
  profile as localProfile,
  socialLinks as localSocialLinks,
} from "@/content/profile";
import {
  projects as localProjects,
  getProjectBySlug as getLocalProject,
  technologies as localTechnologies,
} from "@/content/projects";

type ApiTechnology = { name: string; category: string; group: string | null };
type ApiImage = { src: string; alt: string };
type ApiProject = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: string | null;
  status: string;
  is_featured: boolean;
  problem: string | null;
  goals: string[] | null;
  solution: string | null;
  responsibilities: string[] | null;
  architecture: string | null;
  features: string[] | null;
  challenges: string | null;
  testing: string | null;
  results: string | null;
  lessons_learned: string | null;
  repository_url: string | null;
  live_url: string | null;
  technologies: ApiTechnology[];
  images: ApiImage[];
};
type ApiProfile = {
  name: string;
  headline: string;
  introduction: string | null;
  bio: string;
  location: string | null;
  interests: string[] | null;
  skills: string[] | null;
  education: Profile["education"] | null;
  social_links: SocialLink[] | null;
  resume_url: string | null;
  public_email: string | null;
};
type ApiExperience = {
  id: number;
  role: string;
  organization: string;
  start_date: string;
  end_date: string | null;
  summary: string;
};

export function getBackendUrl(
  env: NodeJS.ProcessEnv = process.env,
): URL | null {
  if (!env.BACKEND_API_URL?.trim()) return null;
  const url = new URL(env.BACKEND_API_URL);
  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    )
  )
    throw new Error("BACKEND_API_URL must use HTTPS or localhost");
  if (
    url.pathname !== "/" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error("BACKEND_API_URL must be an origin");
  return url;
}

async function apiGet<T>(path: string): Promise<T> {
  const base = getBackendUrl();
  if (!base) throw new Error("Backend is not configured");
  const response = await fetch(new URL(`/api/v1${path}`, base), {
    next: { revalidate: 60 },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok)
    throw new Error(`Portfolio API returned ${response.status}`);
  return response.json() as Promise<T>;
}

function mapTechnology(item: ApiTechnology): Technology {
  const category: Technology["category"] = [
    "language",
    "framework",
    "database",
    "tool",
  ].includes(item.category)
    ? (item.category as Technology["category"])
    : "tool";
  const group: Technology["group"] = [
    "Backend",
    "Frontend",
    "Database",
    "DevOps",
    "Tools",
  ].includes(item.group || "")
    ? (item.group as Technology["group"])
    : undefined;
  return { name: item.name, category, group };
}

function mapProject(item: ApiProject): Project {
  return {
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    description: item.description,
    category: item.category || undefined,
    status: item.status,
    featured: item.is_featured,
    problem: item.problem || undefined,
    goals: item.goals || undefined,
    solution: item.solution || undefined,
    responsibilities: item.responsibilities || undefined,
    architecture: item.architecture || undefined,
    features: item.features || undefined,
    challenges: item.challenges || undefined,
    testing: item.testing || undefined,
    results: item.results || undefined,
    lessonsLearned: item.lessons_learned || undefined,
    repositoryUrl: item.repository_url || undefined,
    liveUrl: item.live_url || undefined,
    technologies: item.technologies.map(mapTechnology),
    thumbnail: item.images[0],
    screenshots: item.images.slice(1),
    placeholder: false,
  };
}

export async function loadProjects(featured?: boolean): Promise<Project[]> {
  if (!getBackendUrl())
    return featured
      ? localProjects.filter((item) => item.featured)
      : localProjects;
  const items: Project[] = [];
  let offset = 0;
  while (true) {
    const query = `?limit=50&offset=${offset}${featured === undefined ? "" : `&featured=${featured}`}`;
    const page = await apiGet<{ items: ApiProject[]; total: number }>(
      `/projects${query}`,
    );
    items.push(...page.items.map(mapProject));
    offset += page.items.length;
    if (!page.items.length || offset >= page.total || offset >= 1000) break;
  }
  return items;
}

export async function loadProject(slug: string): Promise<Project | null> {
  if (!getBackendUrl()) return getLocalProject(slug) || null;
  const base = getBackendUrl()!;
  const response = await fetch(
    new URL(`/api/v1/projects/${encodeURIComponent(slug)}`, base),
    { next: { revalidate: 60 }, signal: AbortSignal.timeout(5000) },
  );
  if (response.status === 404) return null;
  if (!response.ok)
    throw new Error(`Portfolio API returned ${response.status}`);
  return mapProject((await response.json()) as ApiProject);
}

export async function loadTechnologies(): Promise<Technology[]> {
  if (!getBackendUrl()) return localTechnologies;
  return (await apiGet<ApiTechnology[]>("/technologies")).map(mapTechnology);
}

export async function loadProfile(): Promise<Profile | null> {
  if (!getBackendUrl()) return localProfile;
  const base = getBackendUrl()!;
  const response = await fetch(new URL("/api/v1/profile", base), {
    next: { revalidate: 60 },
    signal: AbortSignal.timeout(5000),
  });
  if (response.status === 404) return null;
  if (!response.ok)
    throw new Error(`Portfolio API returned ${response.status}`);
  const item = (await response.json()) as ApiProfile;
  return {
    name: item.name,
    headline: item.headline,
    introduction: item.introduction || undefined,
    bio: item.bio,
    location: item.location || undefined,
    interests: item.interests || [],
    skills: item.skills || [],
    education: item.education || [],
    resumeUrl: item.resume_url || undefined,
    publicEmail: item.public_email || undefined,
    placeholder: false,
  };
}

export async function loadSocialLinks(): Promise<SocialLink[]> {
  if (!getBackendUrl()) return localSocialLinks;
  const base = getBackendUrl()!;
  const response = await fetch(new URL("/api/v1/profile", base), {
    next: { revalidate: 60 },
    signal: AbortSignal.timeout(5000),
  });
  if (response.status === 404) return [];
  if (!response.ok)
    throw new Error(`Portfolio API returned ${response.status}`);
  const item = (await response.json()) as ApiProfile;
  return (item.social_links || [])
    .filter((link) => /^https:\/\//.test(link.url))
    .map((link) => ({ ...link, placeholder: false }));
}

export async function loadExperiences(): Promise<Experience[]> {
  if (!getBackendUrl()) return localExperiences;
  return (await apiGet<ApiExperience[]>("/experiences")).map((item) => ({
    id: String(item.id),
    role: item.role,
    organization: item.organization,
    startDate: item.start_date,
    endDate: item.end_date || undefined,
    summary: item.summary,
    placeholder: false,
  }));
}
