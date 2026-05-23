import { db, initSchema, writeLedgerEntry } from "./db.ts";

initSchema();

db.exec(`
  DELETE FROM ledger_entries;
  DELETE FROM submissions;
  DELETE FROM tasks;
  DELETE FROM users;
`);

const insertUser = db.prepare(`
  INSERT INTO users (id, handle, name, avatar_emoji, balance_cents, escrowed_cents)
  VALUES (?, ?, ?, ?, ?, 0)
`);

const seedUsers: { id: string; handle: string; name: string; emoji: string; balance: number }[] = [
  { id: "u-leo", handle: "leonardomontes", name: "leo", emoji: "🐷", balance: 100_000 },
  { id: "u-alex", handle: "alexp", name: "Alex P.", emoji: "🐻", balance: 1_000_000 },
];

const seedUserTx = db.transaction(() => {
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
seedUserTx();

console.log("Seeded 2 users (no bounties).");
const users = db.prepare("SELECT id, handle, balance_cents, escrowed_cents FROM users").all();
console.log(users);
