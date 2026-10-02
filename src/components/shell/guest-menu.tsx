"use client";

import { SunMoonIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeRadioGroup } from "./theme-radio-group";

export function GuestMenu() {
  return (
    <div className="flex items-center gap-3">
      <Link href="/sign-in" className="underline underline-offset-4">
        Sign in
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm" aria-label="Theme">
            <SunMoonIcon aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <ThemeRadioGroup />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
