import { AccountMenu } from "@/components/shell/account-menu";
import { GuestMenu } from "@/components/shell/guest-menu";
import { ThemeSync } from "@/components/shell/theme-sync";
import { getCurrentUser, getUserTheme } from "@/lib/data/user";

export async function UserSlot() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <>
        <ThemeSync />
        <GuestMenu />
      </>
    );
  }

  const theme = await getUserTheme(user.id);
  return (
    <>
      <ThemeSync theme={theme} />
      <AccountMenu name={user.name} theme={theme} />
    </>
  );
}
