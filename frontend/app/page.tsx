import Link from "next/link";
import { WhopLogo } from "@/components/WhopLogo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col">
      <header className="border-b border-zinc-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <WhopLogo size={24} wordmarkClassName="text-zinc-900 text-lg" />
          <nav className="flex items-center gap-4 sm:gap-7 text-sm text-zinc-700">
            <a href="#" className="hidden sm:inline hover:text-zinc-900">For enterprise</a>
            <a href="#" className="hidden sm:inline hover:text-zinc-900">API</a>
            <a href="#" className="hover:text-zinc-900">Sign in</a>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 -mt-12">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-center text-zinc-900">
          Join the future of work
        </h1>
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-md sm:max-w-none sm:w-auto">
          <Link
            href="/home"
            className="px-8 sm:px-10 py-4 sm:py-5 rounded-2xl bg-[#ff5c1f] text-white font-semibold text-base shadow-sm hover:bg-[#ff7340] transition-colors sm:min-w-[220px] text-center"
          >
            Find paid tasks
          </Link>
          <Link
            href="/post"
            className="px-8 sm:px-10 py-4 sm:py-5 rounded-2xl bg-white text-zinc-900 font-semibold text-base border border-zinc-200 hover:bg-zinc-50 transition-colors sm:min-w-[220px] text-center"
          >
            Post a company
          </Link>
        </div>
      </main>

      <div className="h-24" />
    </div>
  );
}
