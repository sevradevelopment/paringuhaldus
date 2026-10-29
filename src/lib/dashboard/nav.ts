import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Inbox,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const dashboardNav: DashboardNavItem[] = [
  {
    href: "/app",
    label: "Ülevaade",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/app/paringud",
    label: "Päringud",
    icon: Inbox,
  },
  {
    href: "/app/kliendid",
    label: "Kliendid",
    icon: Users,
  },
  {
    href: "/app/hinnapakkumised",
    label: "Hinnapakkumised",
    icon: FileText,
  },
  {
    href: "/app/seaded",
    label: "Seaded",
    icon: Settings,
  },
];
