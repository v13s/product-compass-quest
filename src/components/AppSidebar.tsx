import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ListTodo,
  Map,
  Briefcase,
  Box,
  Lightbulb,
  Tag,
  BarChart3,
  Settings,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/my-work", label: "My Work", icon: ListTodo },
  { to: "/roadmap", label: "Roadmap", icon: Map },
  { to: "/portfolios", label: "Portfolios", icon: Briefcase },
  { to: "/products", label: "Products", icon: Box },
  { to: "/initiatives", label: "Initiatives", icon: Lightbulb },
  { to: "/releases", label: "Releases", icon: Tag },
  { to: "/reports", label: "Reports", icon: BarChart3 },
] as const;

export function AppSidebar() {
  const { profile, user, signOut, canEdit, isAdmin } = useAuth();
  const location = useLocation();
  const initials = (profile?.full_name || user?.email || "U")
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <Map className="h-4 w-4" />
        </div>
        <div className="text-sm font-semibold tracking-tight">Roadmapr</div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Workspace
        </div>
        {NAV.map((item) => {
          const Icon = item.icon;
          const active =
            item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {(canEdit || isAdmin) && (
          <>
            <div className="mt-4 mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Admin
            </div>
            <Link
              to="/settings"
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                location.pathname.startsWith("/settings")
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </>
        )}
      </nav>

      <div className="border-t p-2">
        <Link
          to="/profile"
          className="flex items-center gap-2 rounded-md p-2 hover:bg-sidebar-accent"
        >
          <Avatar className="h-7 w-7">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">
              {profile?.full_name || user?.email}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {isAdmin ? "Admin" : canEdit ? "Product Manager" : "Member"}
            </div>
          </div>
          <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="mt-1 w-full justify-start text-muted-foreground"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
