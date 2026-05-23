"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { AttachmentList } from "@/components/AttachmentList";
import { AttachmentPicker } from "@/components/AttachmentPicker";
import { api, formatMoney, type TaskWithSubmissions, type Submission } from "@/lib/api";
import { useMe } from "@/lib/MeContext";
import { ArrowLeft, Clock, Check, X, ExternalLink, AlertCircle } from "lucide-react";

const CATEGORY_COLORS = {
  Content: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  Design: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  Dev: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Social: "bg-pink-500/15 text-pink-300 border-pink-500/30",
  Research: "bg-amber-500/15 text-amber-300 border-amber-500/30",
} as const;

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { me, refresh } = useMe();
  const [task, setTask] = useState<TaskWithSubmissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.getTask(id);
      setTask(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load, me?.id]);

  async function handleApprove(subId: string) {
    try {
      await api.approve(subId);
      await Promise.all([load(), refresh()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to approve");
    }
  }

  async function handleReject(subId: string) {
    try {
      await api.reject(subId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reject");
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto px-6 py-12 text-zinc-500 text-sm">Loading…</div>
      </AppShell>
    );
  }
  if (!task) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto px-6 py-12 text-zinc-500 text-sm">
          {error ?? "Not found"}
        </div>
      </AppShell>
    );
  }

  const isPoster = me?.id === task.posterId;
  const mySubmission = me ? task.submissions.find((s) => s.workerId === me.id) : undefined;
  const canSubmit = me && !isPoster && task.status === "open" && !mySubmission;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-6 py-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 mb-4"
        >
          <ArrowLeft size={15} /> Back
        </button>

        <div className="bg-[#141416] border border-[#1f1f23] rounded-xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#1f1f23] flex items-center justify-center text-lg shrink-0">
              {task.poster?.avatarEmoji ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-zinc-100">{task.poster?.name}</div>
              <div className="text-xs text-zinc-500">@{task.poster?.handle}</div>
            </div>
            <span
              className={`text-[11px] px-2 py-1 rounded border font-medium ${CATEGORY_COLORS[task.category]}`}
            >
              {task.category}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-zinc-100 leading-tight">{task.title}</h1>
          <p className="text-zinc-300 mt-3 whitespace-pre-wrap leading-relaxed">
            {task.description}
          </p>

          <AttachmentList attachments={task.attachments} title="Brief attachments" />

          <div className="mt-5 flex items-center gap-4 text-sm">
            {task.deadline && (
              <span className="flex items-center gap-1.5 text-zinc-400">
                <Clock size={14} />
                {task.deadline}
              </span>
            )}
            <span
              className={`text-[11px] px-2 py-0.5 rounded border font-medium ${
                task.status === "open"
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  : "bg-zinc-700/30 text-zinc-300 border-zinc-600/40"
              }`}
            >
              {task.status === "open" ? "Open" : "Completed"}
            </span>
          </div>

          <div className="mt-6 pt-6 border-t border-[#1f1f23] flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#ff5c1f]">
                {formatMoney(task.payout)}
              </span>
              <span className="text-sm text-zinc-500">payout</span>
            </div>

            {canSubmit && (
              <button
                onClick={() => setSubmitOpen(true)}
                className="px-5 py-2.5 rounded-lg bg-[#ff5c1f] hover:bg-[#ff7340] text-white text-sm font-semibold"
              >
                Submit work
              </button>
            )}
            {mySubmission && !isPoster && (
              <SubmissionBadge status={mySubmission.status} />
            )}
            {isPoster && (
              <span className="text-xs text-zinc-500 italic">Your bounty</span>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-sm px-3 py-2 flex items-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}
        </div>

        {(isPoster || task.submissions.length > 0) && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-3">
              Submissions ({task.submissions.length})
            </h2>
            {task.submissions.length === 0 ? (
              <div className="bg-[#141416] border border-[#1f1f23] rounded-xl p-6 text-center text-sm text-zinc-500">
                No submissions yet.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {task.submissions.map((s) => (
                  <SubmissionRow
                    key={s.id}
                    submission={s}
                    canReview={isPoster && task.status === "open" && s.status === "pending"}
                    onApprove={() => handleApprove(s.id)}
                    onReject={() => handleReject(s.id)}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {submitOpen && (
        <SubmitModal
          taskId={task.id}
          onClose={() => setSubmitOpen(false)}
          onSubmitted={async () => {
            setSubmitOpen(false);
            await load();
          }}
        />
      )}
    </AppShell>
  );
}

function SubmissionRow({
  submission,
  canReview,
  onApprove,
  onReject,
}: {
  submission: Submission;
  canReview: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="bg-[#141416] border border-[#1f1f23] rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-[#1f1f23] flex items-center justify-center text-base shrink-0">
          {submission.worker?.avatarEmoji ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-100">
              {submission.worker?.name}
            </span>
            <span className="text-xs text-zinc-500">@{submission.worker?.handle}</span>
            <SubmissionBadge status={submission.status} small />
          </div>
          <p className="text-sm text-zinc-300 mt-2 whitespace-pre-wrap">
            {submission.proofText}
          </p>
          {submission.proofLink && (
            <a
              href={submission.proofLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 mt-2"
            >
              <ExternalLink size={13} />
              {submission.proofLink}
            </a>
          )}
          <AttachmentList
            attachments={submission.attachments}
            title="Submitted files"
          />
        </div>

        {canReview && (
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={onApprove}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold"
            >
              <Check size={13} /> Approve & pay
            </button>
            <button
              onClick={onReject}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1f1f23] hover:bg-[#26262a] text-zinc-300 text-xs font-semibold"
            >
              <X size={13} /> Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SubmissionBadge({
  status,
  small,
}: {
  status: Submission["status"];
  small?: boolean;
}) {
  const map = {
    pending: { label: "Pending review", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
    approved: { label: "Approved · paid", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
    rejected: { label: "Rejected", cls: "bg-red-500/15 text-red-300 border-red-500/30" },
  } as const;
  const { label, cls } = map[status];
  return (
    <span
      className={`${small ? "text-[10px]" : "text-xs"} px-2 py-0.5 rounded border font-medium ${cls}`}
    >
      {label}
    </span>
  );
}

function SubmitModal({
  taskId,
  onClose,
  onSubmitted,
}: {
  taskId: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [proofText, setProofText] = useState("");
  const [proofLink, setProofLink] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = proofText.trim().length > 0 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const sub = await api.submit(taskId, {
        proofText: proofText.trim(),
        proofLink: proofLink.trim() || undefined,
      });
      if (files.length > 0) {
        await api.uploadSubmissionAttachments(sub.id, files);
      }
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#141416] border border-[#26262a] rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-zinc-100">Submit your work</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Describe what you did. Add a link to the proof (Google Doc, Figma, Loom, GitHub PR…).
        </p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-300">Proof description</span>
            <textarea
              value={proofText}
              onChange={(e) => setProofText(e.target.value)}
              placeholder="What you delivered, where it lives, anything the poster should know…"
              rows={4}
              className="w-full bg-[#0b0b0c] border border-[#26262a] rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#ff5c1f] resize-none"
              autoFocus
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-300">Proof link (optional)</span>
            <input
              type="url"
              value={proofLink}
              onChange={(e) => setProofLink(e.target.value)}
              placeholder="https://…"
              className="w-full bg-[#0b0b0c] border border-[#26262a] rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#ff5c1f]"
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-300">
              Attach deliverables (optional)
            </span>
            <AttachmentPicker
              files={files}
              onChange={setFiles}
              label="Upload images, docs, PDFs…"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-sm px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-zinc-300 hover:bg-[#1a1a1d]"
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
              {submitting ? "Submitting…" : "Submit work"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
