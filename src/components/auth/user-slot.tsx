import { LocalProgressMerge } from "@/components/auth/local-progress-merge";
import { AccountMenu } from "@/components/shell/account-menu";
import { GuestMenu } from "@/components/shell/guest-menu";
import { ReduceMotionSync } from "@/components/shell/reduce-motion-sync";
import { ThemeSync } from "@/components/shell/theme-sync";
import { getCurrentUser, getUserSettings } from "@/lib/data/user";

export async function UserSlot() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <>
        <ThemeSync />
        <ReduceMotionSync reduceMotion={false} />
        <GuestMenu />
      </>
    );
  }

  const { theme, reduceMotion } = await getUserSettings(user.id);
  return (
    <>
      <ThemeSync theme={theme} />
      <ReduceMotionSync reduceMotion={reduceMotion} />
      <LocalProgressMerge />
      <AccountMenu name={user.name} theme={theme} />
    </>
  );
}
