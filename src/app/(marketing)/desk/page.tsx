import { Suspense } from "react";
import { Walker } from "@/components/brand";
import { DeskStatic } from "@/components/desk/desk-scene/desk-static";
import {
  emptyDeskStacks,
  HERO_HEIGHT,
} from "@/components/desk/desk-scene/model";
import { Desk, DeskFrame } from "../_components/desk";

export default function DeskPage() {
  return (
    <Suspense
      fallback={
        <DeskFrame>
          <Walker />
          <noscript>
            <figure className={`m-0 ${HERO_HEIGHT}`}>
              <DeskStatic stacks={emptyDeskStacks()} />
            </figure>
          </noscript>
        </DeskFrame>
      }
    >
      <Desk />
    </Suspense>
  );
}
