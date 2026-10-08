import type { Metadata } from "next";
import { NotFoundNotice } from "@/components/shell/not-found-notice";

export const metadata: Metadata = { title: "Not found | Ludwig." };

export default function NotFound() {
  return <NotFoundNotice />;
}
