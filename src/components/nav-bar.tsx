import { Gamepad2, Medal, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Game",
    icon: Gamepad2,
    href: "/",
  },
  {
    label: "Leaderboard",
    icon: Medal,
    href: "/leaderboard",
  },
  {
    label: "Profile",
    icon: User,
    href: "/profile",
  },
] as const;

export function NavBar() {
  const location = useLocation();

  return (
    <>
      {/* Desktop Navigation (top) */}
      <nav className="hidden w-full border-b bg-background px-4 md:block">
        <div className="flex h-14 items-center justify-between">
          <div className="flex w-full items-center justify-between space-x-8">
            <div className="text-xl font-bold">CrowdPlay</div>
            <div className="flex items-center space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
                    location.pathname === item.href
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation (bottom) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
        <div className="mx-auto px-4">
          <div className="flex h-16 items-center justify-around">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center space-y-1 text-xs font-medium transition-colors hover:text-primary",
                  location.pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}
