import { Suspense } from "react";
import { UserSlot } from "@/components/auth/user-slot";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="flex justify-end px-4 py-3">
        <Suspense fallback={<p>Loading user</p>}>
          <UserSlot />
        </Suspense>
      </header>
      {children}
    </>
  );
}
