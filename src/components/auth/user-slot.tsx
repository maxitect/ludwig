import Link from "next/link";
import { getCurrentUser } from "@/lib/data/user";
import { SignOutButton } from "./sign-out-button";

export async function UserSlot() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <span>Signed out</span>
        <Link href="/sign-in" className="underline underline-offset-4">
          Sign in
        </Link>
        <Link href="/sign-up" className="underline underline-offset-4">
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span>{user.email}</span>
      <SignOutButton />
    </div>
  );
}
