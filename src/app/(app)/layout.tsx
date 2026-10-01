import { headers } from "next/headers";
import { Suspense } from "react";
import { auth } from "@/lib/auth";

async function UserSlot() {
  const session = await auth.api.getSession({ headers: await headers() });
  return <p>{session?.user.email ?? "Signed out"}</p>;
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header>
        <Suspense fallback={<p>Loading user</p>}>
          <UserSlot />
        </Suspense>
      </header>
      {children}
    </>
  );
}
