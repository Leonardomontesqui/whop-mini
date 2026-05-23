import Link from "next/link";
import { WhopLogo } from "@/components/WhopLogo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0b0b0c] text-zinc-100 flex flex-col">
      <header className="h-14 border-b border-[#1f1f23] bg-[#0b0b0c] flex items-center px-6">
        <Link href="/" aria-label="Whop home">
          <WhopLogo size={22} wordmarkClassName="text-white text-base" />
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center -mt-12">
        <div className="text-7xl font-bold text-[#ff5c1f] mb-4">404</div>
        <h1 className="text-2xl font-bold text-zinc-100">Nothing here yet</h1>
        <p className="text-zinc-400 mt-2 max-w-md">
          This page doesn&apos;t exist. We won&apos;t redirect you — try one of these instead.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            href="/home"
            className="px-5 py-2.5 rounded-lg bg-[#ff5c1f] hover:bg-[#ff7340] text-white text-sm font-semibold"
          >
            Browse bounties
          </Link>
          <Link
            href="/profile"
            className="px-5 py-2.5 rounded-lg bg-[#1f1f23] hover:bg-[#26262a] text-zinc-100 text-sm font-semibold"
          >
            Your profile
          </Link>
        </div>
      </main>
    </div>
  );
}
