import type { Metadata } from "next";
import { NotFoundNotice } from "@/components/shell/not-found-notice";
import { SiteFooter } from "@/components/shell/site-footer";
import { SiteHeader } from "@/components/shell/site-header";

export const metadata: Metadata = { title: "Not found | Ludwig." };

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <NotFoundNotice />
      <SiteFooter />
    </>
  );
}
