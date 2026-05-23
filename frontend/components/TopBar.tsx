"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, Menu, ChevronDown, Check, Building2 } from "lucide-react";
import { WhopLogo } from "./WhopLogo";
import { useMe } from "@/lib/MeContext";
import { formatMoney } from "@/lib/api";

export function TopBar() {
  const { me, users, switchTo } = useMe();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <header className="h-14 border-b border-[#1f1f23] bg-[#0b0b0c] flex items-center px-4 sticky top-0 z-20">
      <button
        aria-label="Menu"
        className="w-9 h-9 rounded-md flex items-center justify-center text-zinc-300 hover:bg-[#17171a]"
      >
        <Menu size={18} />
      </button>

      <Link href="/" className="ml-1 mr-3">
        <WhopLogo size={22} wordmarkClassName="text-white text-base" />
      </Link>

      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            placeholder="Search across Whop"
            className="w-full bg-[#141416] border border-[#26262a] rounded-full pl-9 pr-3 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-[#3a3a40]"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/post"
          className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-full bg-[#ff5c1f] hover:bg-[#ff7340] text-white text-sm font-semibold"
        >
          <Building2 size={15} />
          New company
        </Link>

        <div className="flex items-center h-9 px-3 rounded-full bg-[#141416] border border-[#26262a] text-sm">
          <span className="text-zinc-500 mr-1">balance</span>
          <span className="text-zinc-100 font-semibold">
            {me ? formatMoney(me.balance) : "—"}
          </span>
          {me && me.escrowed > 0 && (
            <span className="ml-2 pl-2 border-l border-[#26262a] text-[11px] text-amber-400">
              {formatMoney(me.escrowed)} in payouts
            </span>
          )}
        </div>

        <button
          aria-label="Notifications"
          className="relative w-9 h-9 rounded-full bg-[#141416] border border-[#26262a] flex items-center justify-center text-zinc-200 hover:bg-[#1a1a1d]"
        >
          <Bell size={16} />
        </button>

        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 pl-1 pr-1.5 py-1 rounded-full hover:bg-[#1a1a1d]"
          >
            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 via-orange-400 to-orange-600 flex items-center justify-center text-sm">
              {me?.avatarEmoji ?? "🐷"}
            </span>
            <ChevronDown size={14} className="text-zinc-400" />
          </button>

          {open && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setOpen(false)}
                aria-hidden
              />
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#141416] border border-[#26262a] shadow-xl z-40 overflow-hidden">
                <div className="px-3 py-2 text-[11px] uppercase tracking-wider text-zinc-500">
                  Switch persona (demo)
                </div>
                <ul>
                  {users.map((u) => {
                    const active = me?.id === u.id;
                    return (
                      <li key={u.id}>
                        <button
                          onClick={async () => {
                            setOpen(false);
                            await switchTo(u.id);
                            router.push("/profile");
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#1a1a1d] text-left"
                        >
                          <span className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 via-orange-400 to-orange-600 flex items-center justify-center text-sm">
                            {u.avatarEmoji}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-zinc-100">{u.name}</div>
                            <div className="text-xs text-zinc-500">
                              @{u.handle} · {formatMoney(u.balance)}
                            </div>
                          </div>
                          {active && (
                            <Check size={14} className="text-emerald-400" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div className="border-t border-[#26262a]">
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 text-sm text-zinc-300 hover:bg-[#1a1a1d]"
                  >
                    View profile
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
