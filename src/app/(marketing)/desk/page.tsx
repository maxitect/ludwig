import { Suspense } from "react";
import { Walker } from "@/components/brand";
import { Desk, DeskFrame } from "../_components/desk";

export default function DeskPage() {
  return (
    <Suspense
      fallback={
        <DeskFrame>
          <Walker />
        </DeskFrame>
      }
    >
      <Desk />
    </Suspense>
  );
}
