"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Calendar, MoreHorizontal, Rocket, Check, X, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  api,
  formatMoney,
  type Task,
  type SubmissionWithTask,
} from "@/lib/api";
import { useMe } from "@/lib/MeContext";

type Tab = "Posted" | "Claimed" | "Completed";
const TABS: Tab[] = ["Posted", "Claimed", "Completed"];

export default function ProfilePage() {
  const { me, refresh } = useMe();
  const [activeTab, setActiveTab] = useState<Tab>("Posted");

  const [postedTasks, setPostedTasks] = useState<Task[]>([]);
  const [posterSubs, setPosterSubs] = useState<SubmissionWithTask[]>([]);
  const [workerSubs, setWorkerSubs] = useState<SubmissionWithTask[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!me) return;
    setLoading(true);
    try {
      const [posted, posterS, workerS] = await Promise.all([
        api.listTasks({ posterId: me.id }),
        api.posterSubmissions(me.id),
        api.workerSubmissions(me.id),
      ]);
      setPostedTasks(posted);
      setPosterSubs(posterS);
      setWorkerSubs(workerS);
    } finally {
      setLoading(false);
    }
  }, [me]);

  useEffect(() => {
    load();
  }, [load, me?.id]);

  async function handleApprove(id: string) {
    await api.approve(id);
    await Promise.all([load(), refresh()]);
  }
  async function handleReject(id: string) {
    await api.reject(id);
    await load();
  }

  const earned = workerSubs
    .filter((s) => s.status === "approved")
    .reduce((sum, s) => sum + s.task.payout, 0);

  const pendingForMe = posterSubs.filter((s) => s.status === "pending");

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <div className="px-6 pt-8 flex items-start justify-between">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 via-orange-400 to-orange-600 flex items-center justify-center text-4xl">
            {me?.avatarEmoji ?? "🐷"}
          </div>
          <button
            aria-label="More"
            className="w-9 h-9 rounded-full bg-[#1f1f23] hover:bg-[#26262a] flex items-center justify-center text-zinc-300"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>

        <div className="px-6">

          <div className="mt-3">
            <h1 className="text-xl font-bold text-zinc-100">{me?.name ?? "—"}</h1>
            <p className="text-sm text-zinc-500">@{me?.handle ?? "—"}</p>
          </div>

          <div className="mt-3 flex items-center gap-4 text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <MapPin size={12} /> Waterloo, CA
            </span>
            <span className="text-zinc-600">·</span>
            <span className="flex items-center gap-1">
              <Calendar size={12} /> Joined Apr 2025
            </span>
          </div>

          <div className="mt-3 flex items-center gap-4 text-sm flex-wrap">
            <Stat label="Balance" value={me ? formatMoney(me.balance) : "—"} />
            {me && me.escrowed > 0 && (
              <Stat label="In payouts" value={formatMoney(me.escrowed)} accent="amber" />
            )}
            <Stat label="Earned" value={formatMoney(earned)} accent="orange" />
            <Stat label="Posted" value={String(postedTasks.length)} />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button className="flex-1 sm:flex-none sm:px-6 py-2 rounded-lg bg-[#1f1f23] hover:bg-[#26262a] text-sm font-semibold text-zinc-100">
              Edit profile
            </button>
            <Link
              href="/post"
              className="flex-1 sm:flex-none sm:px-6 py-2 rounded-lg bg-[#ff5c1f] hover:bg-[#ff7340] text-center text-sm font-semibold text-white"
            >
              Post a bounty
            </Link>
          </div>
        </div>

        <div className="mt-6 border-b border-[#1f1f23] px-6">
          <div className="flex">
            {TABS.map((tab) => {
              const badge =
                tab === "Posted" && pendingForMe.length > 0 ? pendingForMe.length : null;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
                    activeTab === tab
                      ? "text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {tab}
                  {badge !== null && (
                    <span className="bg-[#ff5c1f] text-white text-[10px] font-semibold rounded-full px-1.5 min-w-[18px] text-center">
                      {badge}
                    </span>
                  )}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3b82f6] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-6">
          {loading ? (
            <div className="text-center py-16 text-zinc-500 text-sm">Loading…</div>
          ) : activeTab === "Posted" ? (
            <PostedTab
              tasks={postedTasks}
              submissions={posterSubs}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ) : activeTab === "Claimed" ? (
            <ClaimedTab submissions={workerSubs} />
          ) : (
            <CompletedTab submissions={workerSubs.filter((s) => s.status === "approved")} />
          )}
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
  accent?: "orange" | "amber";
}) {
  const colorCls =
    accent === "orange"
      ? "text-[#ff5c1f]"
      : accent === "amber"
        ? "text-amber-400"
        : "text-zinc-100";
  return (
    <span>
      <span className={`font-semibold ${colorCls}`}>{value}</span>{" "}
      <span className="text-zinc-500">{label}</span>
    </span>
  );
}

function PostedTab({
  tasks,
  submissions,
  onApprove,
  onReject,
}: {
  tasks: Task[];
  submissions: SubmissionWithTask[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  if (tasks.length === 0) {
    return (
      <EmptyState title="No bounties posted yet" cta="Post your first" href="/post" />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {tasks.map((task) => {
        const subs = submissions.filter((s) => s.taskId === task.id);
        const pending = subs.filter((s) => s.status === "pending");
        return (
          <div
            key={task.id}
            className="bg-[#141416] border border-[#1f1f23] rounded-xl p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <Link
                  href={`/task/${task.id}`}
                  className="text-base font-semibold text-zinc-100 hover:text-white"
                >
                  {task.title}
                </Link>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <StatusPill status={task.status} />
                  <span className="text-zinc-500">·</span>
                  <span className="text-zinc-400">{formatMoney(task.payout)} payout</span>
                  <span className="text-zinc-500">·</span>
                  <span className="text-zinc-400">
                    {subs.length} submission{subs.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
              {pending.length > 0 && (
                <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] px-2 py-0.5 rounded font-medium">
                  {pending.length} to review
                </span>
              )}
            </div>

            {subs.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[#1f1f23] flex flex-col gap-3">
                {subs.map((s) => (
                  <div key={s.id} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#1f1f23] flex items-center justify-center text-sm shrink-0">
                      {s.worker?.avatarEmoji ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-zinc-200 font-medium">{s.worker?.name}</span>
                        <SubStatusPill status={s.status} />
                        {s.attachments.length > 0 && (
                          <span className="text-[10px] text-zinc-500">
                            · {s.attachments.length} file{s.attachments.length === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-300 mt-1 line-clamp-2">{s.proofText}</p>
                      {s.proofLink && (
                        <a
                          href={s.proofLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1"
                        >
                          <ExternalLink size={11} />
                          {s.proofLink}
                        </a>
                      )}
                    </div>
                    {s.status === "pending" && task.status === "open" && (
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button
                          onClick={() => onApprove(s.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold"
                        >
                          <Check size={12} /> Approve & pay
                        </button>
                        <button
                          onClick={() => onReject(s.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1f1f23] hover:bg-[#26262a] text-zinc-300 text-xs font-semibold"
                        >
                          <X size={12} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ClaimedTab({ submissions }: { submissions: SubmissionWithTask[] }) {
  const active = submissions.filter((s) => s.status !== "approved");
  if (active.length === 0) {
    return <EmptyState title="No active claims" cta="Find a bounty" href="/home" />;
  }
  return (
    <div className="flex flex-col gap-3">
      {active.map((s) => (
        <ClaimRow key={s.id} sub={s} />
      ))}
    </div>
  );
}

function CompletedTab({ submissions }: { submissions: SubmissionWithTask[] }) {
  if (submissions.length === 0) {
    return (
      <EmptyState
        title="No tasks completed yet"
        cta="Browse bounties"
        href="/home"
      />
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {submissions.map((s) => (
        <ClaimRow key={s.id} sub={s} />
      ))}
    </div>
  );
}

function ClaimRow({ sub }: { sub: SubmissionWithTask }) {
  return (
    <div className="bg-[#141416] border border-[#1f1f23] rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <Link
            href={`/task/${sub.taskId}`}
            className="text-sm font-semibold text-zinc-100 hover:text-white"
          >
            {sub.task.title}
          </Link>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <SubStatusPill status={sub.status} />
            <span className="text-zinc-500">·</span>
            <span className="text-zinc-400">{formatMoney(sub.task.payout)}</span>
            <span className="text-zinc-500">·</span>
            <span className="text-zinc-500">from @{sub.task.poster?.handle}</span>
          </div>
        </div>
        {sub.status === "approved" && (
          <span className="text-sm font-bold text-emerald-400">
            +{formatMoney(sub.task.payout)}
          </span>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: Task["status"] }) {
  const map = {
    open: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    completed: "bg-zinc-700/30 text-zinc-300 border-zinc-600/40",
    cancelled: "bg-red-500/15 text-red-300 border-red-500/30",
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${map[status]}`}>
      {status}
    </span>
  );
}

function SubStatusPill({ status }: { status: "pending" | "approved" | "rejected" }) {
  const map = {
    pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    approved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    rejected: "bg-red-500/15 text-red-300 border-red-500/30",
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${map[status]}`}>
      {status}
    </span>
  );
}

function EmptyState({
  title,
  cta,
  href,
}: {
  title: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="text-center py-16 flex flex-col items-center">
      <div className="w-14 h-14 rounded-xl bg-[#1f1f23] flex items-center justify-center mb-4">
        <Rocket size={22} className="text-zinc-400" />
      </div>
      <p className="text-zinc-300 mb-4">{title}</p>
      <Link
        href={href}
        className="px-5 py-2 rounded-lg text-sm font-semibold bg-[#3b82f6] hover:bg-[#2563eb] text-white"
      >
        {cta}
      </Link>
    </div>
  );
}
