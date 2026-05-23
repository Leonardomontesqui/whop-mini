"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutDashboard, Plus, Building2 } from "lucide-react";
import { useMe } from "@/lib/MeContext";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const mainNav: NavItem[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/post", label: "Post a company", icon: Plus },
];

export function Sidebar() {
  const pathname = usePathname();
  const { myCompanies } = useMe();

  return (
    <aside className="w-60 shrink-0 border-r border-[#1f1f23] bg-[#0d0d0f] h-screen sticky top-0 overflow-y-auto">
      <div className="px-3 py-3">
        <nav className="flex flex-col gap-0.5">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-[#1f1f23] text-white"
                    : "text-zinc-300 hover:bg-[#17171a] hover:text-white"
                }`}
              >
                <Icon size={18} className="shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {myCompanies.length > 0 && (
          <>
            <div className="mt-5 mb-2 px-3 text-[11px] font-semibold tracking-wider uppercase text-zinc-500 flex items-center gap-1.5">
              <Building2 size={11} /> Companies
            </div>
            <div className="flex flex-col gap-0.5">
              {myCompanies.map((c) => {
                const href = `/company/${c.id}`;
                const active = pathname === href;
                return (
                  <Link
                    key={c.id}
                    href={href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                      active
                        ? "bg-[#1f1f23] text-white"
                        : "text-zinc-300 hover:bg-[#17171a] hover:text-white"
                    }`}
                  >
                    <span className="w-6 h-6 rounded-md bg-[#1f1f23] flex items-center justify-center text-sm shrink-0">
                      {c.avatarEmoji}
                    </span>
                    <span className="truncate">{c.name}</span>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
