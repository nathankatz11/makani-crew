"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CalendarDays, Trophy, Users } from "lucide-react";
import { ProfileSwitcher } from "./profile-switcher";

export function Nav({ sailor, crew }: { sailor: string; crew: string[] }) {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Home", icon: CalendarDays },
    { href: "/availability", label: "Status", icon: Users },
    { href: "/results", label: "Results", icon: Trophy },
  ];

  return (
    <nav className="sticky bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-around py-2">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-1.5 py-1 text-[10px]",
              pathname === href
                ? "text-foreground font-medium"
                : "text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
        <ProfileSwitcher currentSailor={sailor} crew={crew} />
      </div>
    </nav>
  );
}
