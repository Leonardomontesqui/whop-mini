"use client";

import Link from "next/link";
import { Heart, MessageCircle, BarChart3, Share2, MoreHorizontal, Clock } from "lucide-react";
import { formatMoney, type Task } from "@/lib/api";
import { useMe } from "@/lib/MeContext";

const CATEGORY_COLORS: Record<Task["category"], string> = {
  Content: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  Design: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  Dev: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Social: "bg-pink-500/15 text-pink-300 border-pink-500/30",
  Research: "bg-amber-500/15 text-amber-300 border-amber-500/30",
};

export function TaskCard({ task }: { task: Task }) {
  const { me } = useMe();
  const isCompleted = task.status === "completed";
  const isOwner = !!me && task.company?.ownerId === me.id;

  const ctaLabel = isCompleted
    ? "Closed"
    : isOwner
      ? "Review submissions"
      : "View & Claim";
  const ctaCls = isCompleted
    ? "bg-[#1f1f23] text-zinc-400 cursor-not-allowed"
    : isOwner
      ? "bg-[#3b82f6] text-white hover:bg-[#2563eb]"
      : "bg-[#ff5c1f] text-white hover:bg-[#ff7340]";

  return (
    <article className="bg-[#141416] border border-[#1f1f23] rounded-xl p-4 hover:border-[#2a2a30] transition-colors">
      <header className="flex items-start gap-3">
        <Link
          href={task.companyId ? `/company/${task.companyId}` : "#"}
          className="w-10 h-10 rounded-lg bg-[#1f1f23] flex items-center justify-center text-lg shrink-0 hover:bg-[#26262a]"
        >
          {task.company?.avatarEmoji ?? task.poster?.avatarEmoji ?? "?"}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-sm">
            <Link
              href={task.companyId ? `/company/${task.companyId}` : "#"}
              className="font-semibold text-zinc-100 truncate hover:text-white"
            >
              {task.company?.name ?? "Unknown company"}
            </Link>
            <span className="text-zinc-600">·</span>
            <span className="text-xs text-zinc-500 truncate">
              by @{task.poster?.handle ?? ""}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded border font-medium ${CATEGORY_COLORS[task.category]}`}
            >
              {task.category}
            </span>
            {task.deadline && (
              <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                <Clock size={11} />
                {task.deadline}
              </span>
            )}
            {isCompleted && (
              <span className="text-[11px] px-1.5 py-0.5 rounded border bg-zinc-700/30 border-zinc-600/40 text-zinc-300">
                Completed
              </span>
            )}
          </div>
        </div>
        <button aria-label="More" className="text-zinc-500 hover:text-zinc-300 p-1">
          <MoreHorizontal size={18} />
        </button>
      </header>

      <div className="mt-3 pl-[52px]">
        <Link href={`/task/${task.id}`} className="block group">
          <h3 className="text-[15px] font-semibold text-zinc-100 leading-snug group-hover:text-white">
            {task.title}
          </h3>
          <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed line-clamp-2">
            {task.description}
          </p>
        </Link>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-[#ff5c1f]">
              {formatMoney(task.payout)}
            </span>
            <span className="text-xs text-zinc-500">payout</span>
          </div>
          <Link
            href={`/task/${task.id}`}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${ctaCls}`}
          >
            {ctaLabel}
          </Link>
        </div>

        <div className="mt-3 pt-3 border-t border-[#1f1f23] flex items-center gap-6 text-zinc-500">
          <button className="flex items-center gap-1.5 text-xs hover:text-zinc-300">
            <Heart size={14} />
            <span>0</span>
          </button>
          <button className="flex items-center gap-1.5 text-xs hover:text-zinc-300">
            <MessageCircle size={14} />
            <span>0</span>
          </button>
          <button className="flex items-center gap-1.5 text-xs hover:text-zinc-300">
            <BarChart3 size={14} />
            <span>{Math.round(task.payout * 31.4)}</span>
          </button>
          <button className="ml-auto flex items-center gap-1.5 text-xs hover:text-zinc-300">
            <Share2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}
