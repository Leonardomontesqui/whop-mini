"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import { useMe } from "@/lib/MeContext";
import { Building2, Sparkles } from "lucide-react";

const EMOJI_PICKS = ["🏢", "🚀", "🍫", "🎨", "💻", "📈", "🛍️", "🎮", "🎵", "⚡", "🔥", "🌶️"];

export default function CreateCompanyPage() {
  const router = useRouter();
  const { me, refresh } = useMe();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState("🏢");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const company = await api.createCompany({
        name: name.trim(),
        description: description.trim(),
        avatarEmoji,
      });
      await refresh();
      router.push(`/company/${company.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create company");
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 text-[#ff5c1f] mb-2">
          <Sparkles size={18} />
          <span className="text-sm font-semibold uppercase tracking-wider">
            New company
          </span>
        </div>
        <h1 className="text-3xl font-bold mb-1">Hey, register a company</h1>
        <p className="text-zinc-400 mb-8">
          A company is where you post bounties from. {me?.name} will be its owner.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-300">Company name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dark Matter Chocolates"
              maxLength={64}
              className="input"
              autoFocus
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-300">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does your company do? One or two sentences."
              rows={4}
              className="input resize-none"
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-300">Avatar</span>
            <div className="flex flex-wrap gap-2">
              {EMOJI_PICKS.map((e) => (
                <button
                  type="button"
                  key={e}
                  onClick={() => setAvatarEmoji(e)}
                  className={`w-10 h-10 rounded-lg border text-xl transition-colors ${
                    avatarEmoji === e
                      ? "border-[#ff5c1f] bg-[#ff5c1f]/10"
                      : "border-[#26262a] bg-[#141416] hover:border-[#3a3a40]"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#26262a] bg-[#141416] p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-[#1f1f23] flex items-center justify-center text-2xl">
              {avatarEmoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-semibold text-zinc-100 truncate">
                {name.trim() || "Your company"}
              </div>
              <div className="text-xs text-zinc-500 truncate">
                Owned by @{me?.handle ?? "—"}
              </div>
              {description.trim() && (
                <div className="text-sm text-zinc-400 mt-1 line-clamp-2">
                  {description.trim()}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-sm px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/home")}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-zinc-300 hover:bg-[#17171a]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold ${
                canSubmit
                  ? "bg-[#ff5c1f] text-white hover:bg-[#ff7340]"
                  : "bg-[#1f1f23] text-zinc-500 cursor-not-allowed"
              }`}
            >
              <Building2 size={15} />
              {submitting ? "Creating…" : "Create company"}
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
