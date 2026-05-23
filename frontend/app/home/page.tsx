"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { TaskCard } from "@/components/TaskCard";
import { api, type Task } from "@/lib/api";
import { useMe } from "@/lib/MeContext";
import { Plus, Building2 } from "lucide-react";

type Tab = "All" | "Available" | "Mine";
const TABS: Tab[] = ["All", "Available", "Mine"];

function useMyCompanyIds() {
  const { myCompanies } = useMe();
  return new Set(myCompanies.map((c) => c.id));
}

export default function HomePage() {
  const { me } = useMe();
  const [activeTab, setActiveTab] = useState<Tab>("Available");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listTasks();
      setTasks(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, me?.id]);

  const myCompanyIds = useMyCompanyIds();
  const filtered = tasks.filter((t) => {
    if (activeTab === "Mine") return myCompanyIds.has(t.companyId);
    if (activeTab === "Available")
      return t.status === "open" && !myCompanyIds.has(t.companyId);
    return true;
  });

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            Open bounties
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          </h1>

          <div className="flex items-center gap-1 bg-[#141416] border border-[#1f1f23] rounded-full p-1 self-start sm:self-auto">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1 rounded-full text-sm transition-colors ${
                  activeTab === tab
                    ? "bg-[#26262a] text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <Link
          href="/post"
          className="block bg-[#141416] border border-[#1f1f23] rounded-xl p-4 mb-5 hover:border-[#2a2a30] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 via-orange-400 to-orange-600 flex items-center justify-center text-base shrink-0">
              {me?.avatarEmoji ?? "🐷"}
            </div>
            <div className="flex-1 min-w-0 text-zinc-500 text-sm">
              <span className="hidden sm:inline">Got work that needs doing? </span>
              <span className="text-zinc-300">Register a company to post bounties.</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ff5c1f] text-white text-sm font-semibold shrink-0">
              <Building2 size={14} />
              <span className="hidden sm:inline">New company</span>
            </div>
          </div>
        </Link>

        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="text-center py-16 text-zinc-500 text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-sm">
              {activeTab === "Mine"
                ? "You haven't posted any bounties yet."
                : "No bounties here yet."}
            </div>
          ) : (
            filtered.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </div>
      </div>
    </AppShell>
  );
}
