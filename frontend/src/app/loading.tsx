import { Container } from "@/components/ui/primitives";
import { LoadingState } from "@/components/shared/states";

export default function Loading() {
  return (
    <main className="py-24">
      <Container>
        <LoadingState label="Đang tải nội dung" />
      </Container>
    </main>
  );
}
