import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { projects } from "@/content/projects";
import { filterProjects } from "@/lib/project-filters";
import { Header } from "@/components/layout/header";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ProjectCard } from "@/components/projects/portfolio-parts";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/shared/states";
import { ContactForm } from "@/components/contact/contact-form";

const setTheme = vi.fn();
vi.mock("next/navigation", () => ({ usePathname: () => "/projects" }));
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme }),
}));
vi.mock("@/components/shared/reveal", () => ({
  Reveal: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  setTheme.mockClear();
});

describe("navigation and theme", () => {
  it("marks the current route and exposes the mobile menu", () => {
    render(<Header />);
    expect(
      screen
        .getByRole("navigation", { name: "Điều hướng chính" })
        .querySelector('a[aria-current="page"]'),
    ).toHaveAttribute("href", "/projects");
    fireEvent.click(screen.getByRole("button", { name: "Mở menu" }));
    expect(
      screen.getByRole("navigation", { name: "Điều hướng di động" }),
    ).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(
      screen.queryByRole("navigation", { name: "Điều hướng di động" }),
    ).not.toBeInTheDocument();
  });
  it("changes the selected theme", async () => {
    render(<ThemeToggle />);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Chế độ sáng" }),
      ).toHaveAttribute("aria-pressed", "true"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Chế độ tối" }));
    expect(setTheme).toHaveBeenCalledWith("dark");
  });
});

describe("portfolio content and states", () => {
  it("renders a labeled project card and a real detail link", () => {
    render(<ProjectCard project={projects[0]} />);
    expect(screen.getByText(projects[0].title)).toBeInTheDocument();
    expect(screen.getByText("Dữ liệu mẫu")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Xem chi tiết/ })).toHaveAttribute(
      "href",
      `/projects/${projects[0].slug}`,
    );
  });
  it("filters the local content", () => {
    expect(
      filterProjects(projects, "FastAPI", "all").map((item) => item.slug),
    ).toEqual(["coffee-shop-management-system"]);
    expect(filterProjects(projects, "unknown", "all")).toEqual([]);
  });
  it("renders loading, empty, and error states", () => {
    render(
      <>
        <LoadingState />
        <EmptyState title="Không có mục" />
        <ErrorState title="Lỗi tải" />
      </>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Đang tải");
    expect(screen.getByText("Không có mục")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Lỗi tải");
  });
});

describe("contact form", () => {
  it("shows client validation errors without sending", () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    render(<ContactForm configured />);
    fireEvent.click(screen.getByRole("button", { name: "Gửi lời nhắn" }));
    expect(screen.getByText(/Tên phải có/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("shows accepted only after the endpoint confirms", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ accepted: true }), { status: 202 }),
    );
    render(<ContactForm configured />);
    fireEvent.change(screen.getByLabelText("Tên *"), {
      target: { value: "Ada" },
    });
    fireEvent.change(screen.getByLabelText("Email *"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Lời nhắn *"), {
      target: { value: "Hello from a test." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Gửi lời nhắn" }));
    expect(await screen.findByRole("status")).toHaveTextContent("đã tiếp nhận");
  });
  it("reports an endpoint failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Gửi thất bại" }), { status: 502 }),
    );
    render(<ContactForm configured />);
    fireEvent.change(screen.getByLabelText("Tên *"), {
      target: { value: "Ada" },
    });
    fireEvent.change(screen.getByLabelText("Email *"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Lời nhắn *"), {
      target: { value: "Hello from a test." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Gửi lời nhắn" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Gửi thất bại");
  });
});
