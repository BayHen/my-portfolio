import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createElement } from "react";
import { MediaGrid, MediaUploader } from "@/components/admin/media-library";
import { PortfolioImage } from "@/components/shared/portfolio-image";
import type { MediaAsset } from "@/types/media";

vi.mock("next/image", () => ({
  default: ({ fill, unoptimized, ...props }: Record<string, unknown>) => {
    void fill;
    void unoptimized;
    return createElement("img", props);
  },
}));

const asset: MediaAsset = {
  id: "00000000-0000-4000-8000-000000000001",
  url: "http://127.0.0.1:8000/api/v1/media/files/example",
  alt: "Ảnh đại diện thử nghiệm",
  content_type: "image/png",
  byte_size: 2048,
  width: 120,
  height: 120,
  created_at: "2026-01-01T00:00:00Z",
  usage: [],
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("media components", () => {
  it("shows a safe fallback if a public image fails", async () => {
    render(
      <PortfolioImage
        src={asset.url}
        alt={asset.alt}
        sizes="120px"
        fallback={<span>Ảnh đang cập nhật</span>}
      />,
    );
    fireEvent.error(screen.getByRole("img", { name: asset.alt }));
    await waitFor(() =>
      expect(screen.getByText("Ảnh đang cập nhật")).toBeInTheDocument(),
    );
  });

  it("lets a keyboard user select an existing image", () => {
    const onSelect = vi.fn();
    render(<MediaGrid items={[asset]} onSelect={onSelect} />);
    const button = screen.getByRole("button", { name: new RegExp(asset.alt) });
    button.focus();
    fireEvent.keyDown(button, { key: "Enter" });
    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledWith(asset);
  });

  it("rejects an unsupported file before uploading", async () => {
    render(<MediaUploader onUploaded={vi.fn()} />);
    const input = screen.getByLabelText("Kéo ảnh vào đây hoặc chọn tệp");
    fireEvent.change(input, {
      target: {
        files: [new File(["<svg/>"], "bad.svg", { type: "image/svg+xml" })],
      },
    });
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "JPEG, PNG hoặc WebP",
      ),
    );
  });
});
