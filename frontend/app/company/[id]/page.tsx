"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { TaskCard } from "@/components/TaskCard";
import { api, formatMoney, type CompanyWithTasks } from "@/lib/api";
import { useMe } from "@/lib/MeContext";
import { Plus, Rocket, Building2 } from "lucide-react";

type Tab = "All" | "Open" | "Completed";
const TABS: Tab[] = ["All", "Open", "Completed"];

export default function CompanyPage() {
  const { id } = useParams<{ id: string }>();
  const { me } = useMe();
  const [company, setCompany] = useState<CompanyWithTasks | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCompany(id);
      setCompany(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load, me?.id]);

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto px-6 py-12 text-zinc-500 text-sm">Loading…</div>
      </AppShell>
    );
  }
  if (!company) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto px-6 py-12 text-zinc-500 text-sm">
          {error ?? "Company not found"}
        </div>
      </AppShell>
    );
  }

  const isOwner = me?.id === company.ownerId;
  const totalPayout = company.tasks.reduce((s, t) => s + t.payout, 0);
  const openCount = company.tasks.filter((t) => t.status === "open").length;
  const completedCount = company.tasks.filter((t) => t.status === "completed").length;

  const filtered =
    activeTab === "All"
      ? company.tasks
      : activeTab === "Open"
        ? company.tasks.filter((t) => t.status === "open")
        : company.tasks.filter((t) => t.status === "completed");

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#1f1f23] flex items-center justify-center text-2xl sm:text-3xl shrink-0">
            {company.avatarEmoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-wider font-semibold">
              <Building2 size={11} /> Company
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 mt-0.5">{company.name}</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Owned by{" "}
              <Link
                href="/profile"
                className="hover:text-zinc-300 text-zinc-300 font-medium"
              >
                @{company.owner?.handle ?? "—"}
              </Link>
            </p>
            {company.description && (
              <p className="text-sm text-zinc-300 mt-3 leading-relaxed">
                {company.description}
              </p>
            )}
          </div>
          {isOwner && (
            <Link
              href={`/company/${company.id}/new-bounty`}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#ff5c1f] hover:bg-[#ff7340] text-white text-sm font-semibold shrink-0"
            >
              <Plus size={15} /> Create bounty
            </Link>
          )}
        </div>

        {isOwner && (
          <Link
            href={`/company/${company.id}/new-bounty`}
            className="sm:hidden mt-4 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#ff5c1f] hover:bg-[#ff7340] text-white text-sm font-semibold w-full"
          >
            <Plus size={15} /> Create bounty
          </Link>
        )}

        <div className="mt-5 sm:mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          <Stat label="Bounties" value={String(company.tasks.length)} />
          <Stat label="Open" value={String(openCount)} accent={openCount > 0 ? "emerald" : undefined} />
          <Stat label="Total payouts" value={formatMoney(totalPayout)} />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-100">Bounties</h2>
          {company.tasks.length > 0 && (
            <div className="flex items-center gap-1 bg-[#141416] border border-[#1f1f23] rounded-full p-1">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    activeTab === tab
                      ? "bg-[#26262a] text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4">
          {company.tasks.length === 0 ? (
            <EmptyState
              isOwner={isOwner}
              companyId={company.id}
              companyName={company.name}
            />
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-sm">
              No bounties in this view.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 text-xs text-zinc-600">
          {completedCount > 0 && `${completedCount} bounty${completedCount === 1 ? "" : "s"} paid out · `}
          Company created {new Date(company.createdAt.replace(" ", "T") + "Z").toLocaleDateString()}
        </div>
      </div>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "emerald";
}) {
  return (
    <div className="bg-[#141416] border border-[#1f1f23] rounded-xl px-3 sm:px-4 py-3 min-w-0">
      <div className="text-[10px] sm:text-xs uppercase tracking-wider text-zinc-500 truncate">{label}</div>
      <div
        className={`mt-1 text-lg sm:text-xl font-bold truncate ${
          accent === "emerald" ? "text-emerald-400" : "text-zinc-100"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function EmptyState({
  isOwner,
  companyId,
  companyName,
}: {
  isOwner: boolean;
  companyId: string;
  companyName: string;
}) {
  return (
    <div className="bg-[#141416] border border-[#1f1f23] rounded-2xl px-6 py-16 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-xl bg-[#1f1f23] flex items-center justify-center mb-4">
        <Rocket size={22} className="text-zinc-400" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-100">
        {isOwner ? `${companyName} hasn't posted a bounty yet` : `${companyName} hasn't posted any bounties`}
      </h3>
      <p className="text-sm text-zinc-400 mt-1 max-w-sm">
        {isOwner
          ? "Post your first bounty — set a price, describe the work, and we'll lock the payout from your balance until you approve a submission."
          : "Check back later — this company hasn't opened any bounties yet."}
      </p>
      {isOwner && (
        <Link
          href={`/company/${companyId}/new-bounty`}
          className="mt-6 flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#ff5c1f] hover:bg-[#ff7340] text-white text-sm font-semibold"
        >
          <Plus size={15} /> Create your first bounty
        </Link>
      )}
    </div>
  );
}
