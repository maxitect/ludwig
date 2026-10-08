import { BulletHoleTransition } from "@/components/brand";
import { SiteFooter } from "@/components/shell/site-footer";
import { SiteHeader } from "@/components/shell/site-header";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <BulletHoleTransition />
      <div className="flex flex-1 flex-col [:where(&)>*]:w-full">{children}</div>
      <SiteFooter />
    </>
  );
}
