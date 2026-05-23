export type TaskCategory =
  | "Content"
  | "Design"
  | "Dev"
  | "Social"
  | "Research"
  | "Crypto";

export type Task = {
  id: string;
  title: string;
  description: string;
  payoutUsd: number;
  category: TaskCategory;
  poster: { name: string; handle: string; emoji: string };
  postedAt: string;
  deadline: string;
  claims: number;
  applicants: number;
  status: "available" | "claimed" | "completed";
};

export const TASKS: Task[] = [
  {
    id: "t-001",
    title: "Write a 5-tweet thread about Whop's creator economy",
    description:
      "Need a punchy 5-tweet thread breaking down why Whop hit $2.67B GMV. Hook in tweet 1, data in tweets 2–4, CTA in tweet 5. Send as a Google Doc.",
    payoutUsd: 45,
    category: "Content",
    poster: { name: "Nobody_1", handle: "anuljt85", emoji: "🐤" },
    postedAt: "13h",
    deadline: "Due in 2 days",
    claims: 18,
    applicants: 14,
    status: "available",
  },
  {
    id: "t-002",
    title: "Design 3 logo concepts for a Telegram trading group",
    description:
      "Looking for bold, crypto-native logos. Vector files (SVG + PNG). Reference: green/black palette, sharp edges.",
    payoutUsd: 180,
    category: "Design",
    poster: { name: "JRGM", handle: "laysoprano", emoji: "🦊" },
    postedAt: "10h",
    deadline: "Due in 4 days",
    claims: 0,
    applicants: 6,
    status: "available",
  },
  {
    id: "t-003",
    title: "Edit a 60-second clip from a 20-min podcast",
    description:
      "Pull the best moment, add captions, vertical 9:16 format. Final delivery as MP4. Reference clips on request.",
    payoutUsd: 90,
    category: "Content",
    poster: { name: "Gabriel", handle: "gabrielkotey", emoji: "🐻" },
    postedAt: "1h",
    deadline: "Due tomorrow",
    claims: 2,
    applicants: 3,
    status: "available",
  },
  {
    id: "t-004",
    title: "Fix a broken webhook in a small Node script (Stripe → Discord)",
    description:
      "~50-line Node script that posts Stripe events to Discord. Stopped working last week. Fix + add a simple retry.",
    payoutUsd: 120,
    category: "Dev",
    poster: { name: "App Mafia", handle: "appmafia", emoji: "🅰️" },
    postedAt: "4h",
    deadline: "Due in 3 days",
    claims: 1,
    applicants: 9,
    status: "available",
  },
  {
    id: "t-005",
    title: "Find 25 SaaS Discord communities for an outreach list",
    description:
      "Need name, invite link, member count, and primary topic. Google Sheet output, no duplicates with my existing list.",
    payoutUsd: 35,
    category: "Research",
    poster: { name: "TokLaunch", handle: "toklaunch", emoji: "🚀" },
    postedAt: "20h",
    deadline: "Due in 5 days",
    claims: 7,
    applicants: 11,
    status: "available",
  },
  {
    id: "t-006",
    title: "Post 1 IG Reel daily for a chocolate brand (7 days)",
    description:
      "Use provided footage. Trending audio. Vertical, 15–30s. Captions, 3 hashtags. Track views in a quick sheet.",
    payoutUsd: 250,
    category: "Social",
    poster: { name: "Dark Matter Chocolates", handle: "darkmatter", emoji: "🍫" },
    postedAt: "6h",
    deadline: "1-week sprint",
    claims: 0,
    applicants: 22,
    status: "available",
  },
  {
    id: "t-007",
    title: "Test new Whop onboarding flow and write 5 specific bugs",
    description:
      "Go through the new flow on web + mobile. Find 5 specific UX bugs with screenshots and reproduction steps.",
    payoutUsd: 60,
    category: "Research",
    poster: { name: "Whop AI", handle: "whopai", emoji: "✨" },
    postedAt: "2h",
    deadline: "Due in 24 hours",
    claims: 4,
    applicants: 18,
    status: "available",
  },
  {
    id: "t-008",
    title: "Translate a 1,200-word product page to Spanish (LATAM)",
    description:
      "Natural, conversational tone — not literal. Glossary provided. Return as a clean markdown file.",
    payoutUsd: 80,
    category: "Content",
    poster: { name: "Memelord.com", handle: "memelord", emoji: "😂" },
    postedAt: "8h",
    deadline: "Due in 2 days",
    claims: 0,
    applicants: 4,
    status: "available",
  },
];

export const CATEGORY_COLORS: Record<TaskCategory, string> = {
  Content: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  Design: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  Dev: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Social: "bg-pink-500/15 text-pink-300 border-pink-500/30",
  Research: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Crypto: "bg-orange-500/15 text-orange-300 border-orange-500/30",
};
