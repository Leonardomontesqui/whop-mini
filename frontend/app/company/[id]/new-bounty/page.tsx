"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { AttachmentPicker } from "@/components/AttachmentPicker";
import { api, formatMoney, type Company } from "@/lib/api";
import { useMe } from "@/lib/MeContext";
import { Sparkles, AlertCircle, ArrowLeft } from "lucide-react";

const CATEGORIES = ["Content", "Design", "Dev", "Social", "Research"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_DOT: Record<Category, string> = {
  Content: "bg-blue-400",
  Design: "bg-purple-400",
  Dev: "bg-emerald-400",
  Social: "bg-pink-400",
  Research: "bg-amber-400",
};

const CATEGORY_DESC: Record<Category, string> = {
  Content: "Writing, editing, translation, podcast clips, threads, scripts.",
  Design: "Logos, illustrations, UI mockups, brand assets, motion graphics.",
  Dev: "Bug fixes, small scripts, integrations, automations, code review.",
  Social: "Posting, scheduling, campaigns, community moderation, DMs.",
  Research: "Lists, market scans, bug hunts, data gathering, user interviews.",
};

export default function NewBountyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { me, refresh } = useMe();

  const [company, setCompany] = useState<Company | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("Content");
  const [payout, setPayout] = useState("");
  const [deadline, setDeadline] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const c = await api.getCompany(id);
      setCompany(c);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load, me?.id]);

  const payoutNum = Number(payout);
  const payoutValid = Number.isFinite(payoutNum) && payoutNum > 0;
  const insufficient = me && payoutValid && payoutNum > me.balance;
  const isOwner = company && me ? company.ownerId === me.id : false;
  const canSubmit =
    !!company &&
    isOwner &&
    title.trim() &&
    description.trim() &&
    payoutValid &&
    !insufficient &&
    !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !company) return;
    setSubmitting(true);
    setError(null);
    try {
      const task = await api.createTask({
        companyId: company.id,
        title: title.trim(),
        description: description.trim(),
        category,
        payout: payoutNum,
        deadline: deadline.trim() || undefined,
      });
      if (files.length > 0) {
        await api.uploadTaskAttachments(task.id, files);
      }
      await refresh();
      router.push(`/company/${company.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create bounty");
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 text-zinc-500 text-sm">{loadError}</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Link
          href={company ? `/company/${company.id}` : "/home"}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 mb-4"
        >
          <ArrowLeft size={15} /> Back to {company?.name ?? "company"}
        </Link>

        <div className="flex items-center gap-2 text-[#ff5c1f] mb-2">
          <Sparkles size={18} />
          <span className="text-sm font-semibold uppercase tracking-wider">
            Create a bounty
          </span>
        </div>
        <h1 className="text-3xl font-bold mb-1">
          Post work for{" "}
          <span className="text-[#ff5c1f]">{company?.name ?? "your company"}</span>
        </h1>
        <p className="text-zinc-400 mb-8">
          Set a price. The payout is locked from your balance until you approve a submission.
        </p>

        {company && !isOwner && (
          <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-200 text-sm px-3 py-2 flex items-center gap-2">
            <AlertCircle size={14} />
            You don&apos;t own this company. Switch to @{company.owner?.handle} to post bounties here.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Edit a 60-second clip from a podcast"
              maxLength={120}
              className="input"
            />
          </Field>

          <Field label="What needs doing?">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief, requirements, deliverables, how to submit proof…"
              rows={5}
              className="input resize-none"
            />
          </Field>

          <Field label="Category">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                    category === c
                      ? "border-[#ff5c1f] bg-[#ff5c1f]/10 text-[#ff5c1f]"
                      : "border-[#26262a] text-zinc-300 hover:border-[#3a3a40]"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${CATEGORY_DOT[c]}`} />
                  {c}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
              {CATEGORY_DESC[category]}
            </p>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Payout (USD)">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium">
                  $
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="1"
                  value={payout}
                  onChange={(e) => setPayout(e.target.value)}
                  placeholder="50"
                  className="input"
                  style={{ paddingLeft: 28 }}
                />
              </div>
            </Field>

            <Field label="Deadline (optional)">
              <input
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                placeholder="e.g. Due in 3 days"
                className="input"
              />
            </Field>
          </div>

          <Field label="Attachments (optional)">
            <AttachmentPicker
              files={files}
              onChange={setFiles}
              label="Add reference files, briefs, brand assets…"
            />
          </Field>

          <div className="rounded-xl border border-[#26262a] bg-[#141416] p-4">
            <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
              Payout preview
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Row label="Your balance" value={me ? formatMoney(me.balance) : "—"} />
              <Row
                label="Payout amount"
                value={payoutValid ? formatMoney(payoutNum) : "—"}
                accent
              />
              <Row
                label="Balance after"
                value={
                  me && payoutValid ? formatMoney(me.balance - payoutNum) : "—"
                }
                warn={!!insufficient}
              />
              <Row label="Status" value="Open" />
            </div>
            {insufficient && (
              <div className="mt-3 flex items-center gap-2 text-xs text-red-400">
                <AlertCircle size={14} />
                Not enough balance to cover this payout.
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-sm px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push(company ? `/company/${company.id}` : "/home")}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-zinc-300 hover:bg-[#17171a]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`px-5 py-2 rounded-lg text-sm font-semibold ${
                canSubmit
                  ? "bg-[#ff5c1f] text-white hover:bg-[#ff7340]"
                  : "bg-[#1f1f23] text-zinc-500 cursor-not-allowed"
              }`}
            >
              {submitting ? "Posting…" : "Post bounty"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .input {
          width: 100%;
          background: #141416;
          border: 1px solid #26262a;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 14px;
          color: #f5f5f5;
          outline: none;
          transition: border-color 0.15s;
        }
        .input::placeholder { color: #6b6b73; }
        .input:focus { border-color: #ff5c1f; }
      `}</style>
    </AppShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-zinc-300">{label}</span>
      {children}
    </label>
  );
}

function Row({
  label,
  value,
  accent,
  warn,
}: {
  label: string;
  value: string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-zinc-500">{label}</span>
      <span
        className={`font-semibold ${
          warn ? "text-red-400" : accent ? "text-amber-400" : "text-zinc-100"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
