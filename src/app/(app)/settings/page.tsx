import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Credit, GridPaper, Walker } from "@/components/brand";
import { SettingsForm } from "@/components/settings/settings-form";
import { getCurrentUser, getUserSettings } from "@/lib/data/user";

export const metadata: Metadata = {
  title: "Settings | Ludwig.",
  description: "Your display name, theme, chess notation and motion.",
};

export default function SettingsPage() {
  return (
    <GridPaper className="flex-1">
      <main className="mx-auto flex max-w-xl flex-col gap-10 px-4 py-12 sm:px-8">
        <Credit level={1} top="Your account" bottom="Settings" />
        <Suspense fallback={<Walker />}>
          <Settings />
        </Suspense>
      </main>
    </GridPaper>
  );
}

async function Settings() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/settings");
  const settings = await getUserSettings(user.id);
  return <SettingsForm initial={{ name: user.name, ...settings }} />;
}
