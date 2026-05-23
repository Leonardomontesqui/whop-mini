"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { api, formatMoney, type LedgerEntry, type LedgerKind } from "@/lib/api";
import { useMe } from "@/lib/MeContext";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Lock,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
  Plus,
} from "lucide-react";

const KIND_META: Record<
  LedgerKind,
  { label: string; tone: "in" | "out"; chipCls: string }
> = {
  starting_balance: {
    label: "Welcome bonus",
    tone: "in",
    chipCls: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  },
  task_funded: {
    label: "Funded bounty",
    tone: "out",
    chipCls: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  task_payout: {
    label: "Earned",
    tone: "in",
    chipCls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  task_refund: {
    label: "Refund",
    tone: "in",
    chipCls: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
};

export default function DashboardPage() {
  const { me } = useMe();
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.ledger();
      setLedger(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, me?.id]);

  const earned = ledger
    .filter((e) => e.kind === "task_payout")
    .reduce((sum, e) => sum + e.amount, 0);
  const funded = ledger
    .filter((e) => e.kind === "task_funded")
    .reduce((sum, e) => sum + Math.abs(e.amount), 0);
  const tasksCompleted = ledger.filter((e) => e.kind === "task_payout").length;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-zinc-500 text-sm mb-1">
              <Sparkles size={14} className="text-[#ff5c1f]" />
              <span className="uppercase tracking-wider font-semibold">
                Dashboard
              </span>
            </div>
            <h1 className="text-3xl font-bold text-zinc-100">
              {me ? `Welcome back, ${me.name.split(" ")[0]}` : "Dashboard"}
            </h1>
          </div>
          <Link
            href="/post"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#ff5c1f] hover:bg-[#ff7340] text-white text-sm font-semibold"
          >
            <Plus size={15} /> Post a bounty
          </Link>
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className="lg:col-span-2 bg-gradient-to-br from-[#1a1a1d] via-[#161618] to-[#0f0f11] border border-[#26262a] rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-60 h-60 rounded-full bg-[#ff5c1f]/10 blur-3xl pointer-events-none" />
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2 relative">
              <Wallet size={15} /> Available balance
            </div>
            <div className="text-5xl font-bold text-zinc-100 tracking-tight relative">
              {me ? formatMoney(me.balance) : "—"}
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm relative">
              {me && me.escrowed > 0 ? (
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Lock size={13} />
                  {formatMoney(me.escrowed)} locked in open bounties
                </span>
              ) : (
                <span className="text-zinc-500">No funds locked in bounties</span>
              )}
            </div>
          </div>

          <div className="bg-[#141416] border border-[#1f1f23] rounded-2xl p-5">
            <StatRow
              icon={<TrendingUp size={14} className="text-emerald-400" />}
              label="Earned"
              value={formatMoney(earned)}
            />
            <StatRow
              icon={<TrendingDown size={14} className="text-amber-400" />}
              label="Funded"
              value={formatMoney(funded)}
            />
            <StatRow
              icon={<Sparkles size={14} className="text-[#ff5c1f]" />}
              label="Tasks completed"
              value={String(tasksCompleted)}
              last
            />
          </div>
        </section>

        <section className="bg-[#141416] border border-[#1f1f23] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1f1f23] flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Ledger</h2>
              <p className="text-xs text-zinc-500">
                Every change to your balance, newest first.
              </p>
            </div>
            <span className="text-xs text-zinc-500">{ledger.length} entries</span>
          </div>

          {loading ? (
            <div className="px-5 py-12 text-center text-sm text-zinc-500">Loading…</div>
          ) : ledger.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-zinc-500">
              No activity yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-zinc-500 bg-[#0f0f11]">
                    <th className="text-left font-medium px-5 py-2.5">Date</th>
                    <th className="text-left font-medium px-3 py-2.5">Type</th>
                    <th className="text-left font-medium px-3 py-2.5">Description</th>
                    <th className="text-right font-medium px-3 py-2.5">Amount</th>
                    <th className="text-right font-medium px-5 py-2.5">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((entry) => (
                    <LedgerRow key={entry.id} entry={entry} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function StatRow({
  icon,
  label,
  value,
  last,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-3 ${
        last ? "" : "border-b border-[#1f1f23]"
      }`}
    >
      <span className="flex items-center gap-2 text-sm text-zinc-400">
        {icon}
        {label}
      </span>
      <span className="font-semibold text-zinc-100">{value}</span>
    </div>
  );
}

function LedgerRow({ entry }: { entry: LedgerEntry }) {
  const meta = KIND_META[entry.kind];
  const isIn = meta.tone === "in";
  const Arrow = isIn ? ArrowDownRight : ArrowUpRight;
  const date = formatDate(entry.createdAt);

  return (
    <tr className="border-t border-[#1a1a1d] hover:bg-[#17171a]">
      <td className="px-5 py-3 text-zinc-400 whitespace-nowrap">{date}</td>
      <td className="px-3 py-3 whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border font-medium ${meta.chipCls}`}
        >
          <Arrow size={11} />
          {meta.label}
        </span>
      </td>
      <td className="px-3 py-3 text-zinc-300 max-w-md">
        {entry.taskId ? (
          <Link
            href={`/task/${entry.taskId}`}
            className="hover:text-white truncate block"
          >
            {entry.description}
          </Link>
        ) : (
          <span className="truncate block">{entry.description}</span>
        )}
      </td>
      <td
        className={`px-3 py-3 text-right font-semibold whitespace-nowrap ${
          isIn ? "text-emerald-400" : "text-amber-400"
        }`}
      >
        {isIn ? "+" : ""}
        {formatMoney(entry.amount)}
      </td>
      <td className="px-5 py-3 text-right text-zinc-300 whitespace-nowrap">
        {formatMoney(entry.balanceAfter)}
      </td>
    </tr>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
