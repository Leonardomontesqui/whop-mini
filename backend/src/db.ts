import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(__dirname, "..");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const dbPath = path.join(DATA_DIR, "whop.db");

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id              TEXT PRIMARY KEY,
      handle          TEXT NOT NULL UNIQUE,
      name            TEXT NOT NULL,
      avatar_emoji    TEXT NOT NULL DEFAULT '🐷',
      balance_cents   INTEGER NOT NULL DEFAULT 0,
      escrowed_cents  INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS companies (
      id            TEXT PRIMARY KEY,
      owner_id      TEXT NOT NULL REFERENCES users(id),
      name          TEXT NOT NULL,
      description   TEXT NOT NULL DEFAULT '',
      avatar_emoji  TEXT NOT NULL DEFAULT '🏢',
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id            TEXT PRIMARY KEY,
      company_id    TEXT NOT NULL REFERENCES companies(id),
      poster_id     TEXT NOT NULL REFERENCES users(id),
      title         TEXT NOT NULL,
      description   TEXT NOT NULL,
      category      TEXT NOT NULL CHECK (category IN ('Content','Design','Dev','Social','Research')),
      payout_cents  INTEGER NOT NULL CHECK (payout_cents > 0),
      deadline      TEXT,
      status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','completed','cancelled')),
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id            TEXT PRIMARY KEY,
      task_id       TEXT NOT NULL REFERENCES tasks(id),
      worker_id     TEXT NOT NULL REFERENCES users(id),
      proof_text    TEXT NOT NULL,
      proof_link    TEXT,
      status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
      submitted_at  TEXT NOT NULL DEFAULT (datetime('now')),
      reviewed_at   TEXT
    );

    CREATE TABLE IF NOT EXISTS ledger_entries (
      id                   INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id              TEXT NOT NULL REFERENCES users(id),
      kind                 TEXT NOT NULL CHECK (kind IN (
        'starting_balance',
        'task_funded',
        'task_refund',
        'task_payout'
      )),
      amount_cents         INTEGER NOT NULL,
      balance_after_cents  INTEGER NOT NULL,
      task_id              TEXT REFERENCES tasks(id),
      submission_id        TEXT REFERENCES submissions(id),
      counterparty_id      TEXT REFERENCES users(id),
      description          TEXT NOT NULL,
      created_at           TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id           TEXT PRIMARY KEY,
      parent_kind  TEXT NOT NULL CHECK (parent_kind IN ('task','submission')),
      parent_id    TEXT NOT NULL,
      filename     TEXT NOT NULL,
      mime_type    TEXT NOT NULL,
      size_bytes   INTEGER NOT NULL,
      stored_path  TEXT NOT NULL,
      uploaded_by  TEXT NOT NULL REFERENCES users(id),
      uploaded_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_attachments_parent ON attachments(parent_kind, parent_id);
    CREATE INDEX IF NOT EXISTS idx_companies_owner ON companies(owner_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_company ON tasks(company_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_poster ON tasks(poster_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_submissions_task ON submissions(task_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_worker ON submissions(worker_id);
    CREATE INDEX IF NOT EXISTS idx_ledger_user ON ledger_entries(user_id, created_at);
  `);
}

export type LedgerKind =
  | "starting_balance"
  | "task_funded"
  | "task_refund"
  | "task_payout";

export function writeLedgerEntry(opts: {
  userId: string;
  kind: LedgerKind;
  amountCents: number;
  taskId?: string;
  submissionId?: string;
  counterpartyId?: string;
  description: string;
}) {
  const row = db.prepare("SELECT balance_cents FROM users WHERE id = ?").get(opts.userId) as
    | { balance_cents: number }
    | undefined;
  if (!row) throw new Error(`user not found: ${opts.userId}`);

  db.prepare(
    `INSERT INTO ledger_entries
       (user_id, kind, amount_cents, balance_after_cents, task_id, submission_id, counterparty_id, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    opts.userId,
    opts.kind,
    opts.amountCents,
    row.balance_cents,
    opts.taskId ?? null,
    opts.submissionId ?? null,
    opts.counterpartyId ?? null,
    opts.description
  );
}
