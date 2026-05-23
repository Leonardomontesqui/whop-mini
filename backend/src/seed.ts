import { db, initSchema, writeLedgerEntry } from "./db.ts";

const seedUsers: { id: string; handle: string; name: string; emoji: string; balance: number }[] = [
  { id: "u-leo", handle: "leonardomontes", name: "leo", emoji: "🐷", balance: 100_000 },
  { id: "u-alex", handle: "alexp", name: "Alex P.", emoji: "🐻", balance: 1_000_000 },
];

function insertSeedUsers() {
  const insertUser = db.prepare(`
    INSERT INTO users (id, handle, name, avatar_emoji, balance_cents, escrowed_cents)
    VALUES (?, ?, ?, ?, ?, 0)
  `);
  const tx = db.transaction(() => {
    for (const u of seedUsers) {
      insertUser.run(u.id, u.handle, u.name, u.emoji, u.balance);
      writeLedgerEntry({
        userId: u.id,
        kind: "starting_balance",
        amountCents: u.balance,
        description: "Welcome bonus — starting balance",
      });
    }
  });
  tx();
}

export function seedIfEmpty() {
  const row = db.prepare("SELECT COUNT(*) as n FROM users").get() as { n: number };
  if (row.n > 0) return false;
  insertSeedUsers();
  return true;
}

export function resetAndSeed() {
  db.exec(`
    DELETE FROM ledger_entries;
    DELETE FROM submissions;
    DELETE FROM tasks;
    DELETE FROM users;
  `);
  insertSeedUsers();
}

const runDirectly = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (runDirectly) {
  initSchema();
  resetAndSeed();
  console.log("Seeded 2 users (no bounties).");
  const users = db.prepare("SELECT id, handle, balance_cents, escrowed_cents FROM users").all();
  console.log(users);
}
