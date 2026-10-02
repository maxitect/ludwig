import { Suspense } from "react";
import { Walker } from "@/components/brand";
import { getCurrentUser } from "@/lib/data/user";
import { Desk } from "./_components/desk";
import { TitleSequence } from "./_components/title-sequence";

async function Landing() {
  const user = await getCurrentUser();
  return user ? <Desk name={user.name} /> : <TitleSequence />;
}

export default function Home() {
  return (
    <Suspense fallback={<Walker className="mx-auto my-24" />}>
      <Landing />
    </Suspense>
  );
}
