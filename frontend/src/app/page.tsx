import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import {
  ProjectCard,
  SectionWrapper,
  TechnologyBadge,
} from "@/components/projects/portfolio-parts";
import {
  ActionLink,
  Badge,
  Card,
  Container,
  Divider,
  SectionHeading,
} from "@/components/ui/primitives";
import { EmptyState } from "@/components/shared/states";
import { projects, technologies } from "@/content/projects";

export default function HomePage() {
  return (
    <main id="main-content">
      <Container>
        <section
          id="home"
          className="border-line scroll-mt-28 border-b py-20 sm:py-28 lg:py-36"
        >
          <div className="grid items-end gap-12 lg:grid-cols-[minmax(0,1fr)_17rem]">
            <div>
              <p className="text-accent mb-7 font-mono text-xs font-semibold tracking-[.2em] uppercase">
                DEVFOLIO / Giai đoạn 02
              </p>
              <h1 className="max-w-4xl text-[clamp(3.4rem,8vw,7.5rem)] leading-[.98] font-semibold tracking-[-.075em]">
                Thiết kế có <span className="text-accent">chủ đích.</span>
              </h1>
              <p className="text-muted mt-8 max-w-xl text-base leading-8 sm:text-lg">
                Nền tảng giao diện cho portfolio của lập trình viên Python
                Backend / Full-stack. Nội dung cá nhân và dự án thật sẽ được bổ
                sung sau khi xác nhận.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <ActionLink href="/#projects">
                  Khám phá thành phần{" "}
                  <ArrowDownRight size={18} aria-hidden="true" />
                </ActionLink>
              </div>
            </div>
            <div className="border-line text-muted border-l pl-5 font-mono text-xs leading-6">
              <p className="text-ink mb-2">SYSTEM NOTES</p>
              <p>01 / Typography</p>
              <p>02 / Components</p>
              <p>03 / Accessibility</p>
              <p className="mt-5">Light · Dark · System</p>
            </div>
          </div>
        </section>
        <SectionWrapper id="projects">
          <div className="mb-8 flex items-end justify-between gap-4">
            <SectionHeading
              eyebrow="01 / Components"
              title="Một ngôn ngữ nhất quán"
              description="Các thành phần dùng lại có kiểu dữ liệu rõ ràng, trạng thái tương tác và khoảng thở đủ rộng."
            />
            <ArrowUpRight
              className="text-accent hidden sm:block"
              size={28}
              aria-hidden="true"
            />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <ProjectCard project={projects[0]} />
            <Card>
              <p className="text-accent font-mono text-xs tracking-[.14em] uppercase">
                Technology / Sample
              </p>
              <h3 className="mt-5 text-xl font-semibold">
                Chi tiết kỹ thuật, trình bày gọn.
              </h3>
              <p className="text-muted mt-3 leading-7">
                Dữ liệu bên dưới chỉ minh họa cách hiển thị. Không thể hiện kỹ
                năng đã được xác nhận.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {technologies.map((item) => (
                  <TechnologyBadge key={item.name} technology={item} />
                ))}
              </div>
            </Card>
          </div>
        </SectionWrapper>
        <Divider />
        <SectionWrapper id="about">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
            <SectionHeading
              eyebrow="02 / Principles"
              title="Rõ ràng trong từng lớp."
            />
            <div className="text-muted space-y-6 text-base leading-8">
              <p>
                Màu nền dịu, bề mặt sạch, nét viền mảnh và chữ có nhịp đọc tự
                nhiên tạo nên cảm giác chuyên nghiệp mà không gây nhiễu.
              </p>
              <p>
                Điều hướng bằng bàn phím, trạng thái focus dễ thấy và tùy chọn
                giảm chuyển động là một phần của hệ thống ngay từ đầu.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge>Responsive</Badge>
                <Badge>Accessible</Badge>
                <Badge>Typed</Badge>
              </div>
            </div>
          </div>
        </SectionWrapper>
        <Divider />
        <SectionWrapper id="contact">
          <SectionHeading
            eyebrow="03 / Next"
            title="Sẵn sàng cho nội dung thật."
            description="Phương thức liên hệ và liên kết mạng xã hội sẽ xuất hiện sau khi được chủ sở hữu xác nhận. Giai đoạn này chưa cung cấp biểu mẫu liên hệ."
          />
          <div className="mt-8 max-w-lg">
            <EmptyState
              title="Chưa có thông tin liên hệ"
              description="Thêm địa chỉ hoặc kênh liên hệ đã xác thực ở giai đoạn tiếp theo."
            />
          </div>
        </SectionWrapper>
      </Container>
    </main>
  );
}
