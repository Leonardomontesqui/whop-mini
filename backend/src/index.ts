import express from "express";
import cors from "cors";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { db, initSchema, writeLedgerEntry } from "./db.ts";
import { session } from "./store.ts";

initSchema();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(__dirname, "..");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase().slice(0, 16);
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const blocked = /\.(exe|sh|bat|cmd|com|app|dll|jar)$/i;
    if (blocked.test(file.originalname)) return cb(new Error("file type not allowed"));
    cb(null, true);
  },
});

const app = express();
const corsOrigin = process.env.CORS_ORIGIN;
app.use(
  cors(
    corsOrigin
      ? {
          origin: corsOrigin.split(",").map((o) => o.trim()).filter(Boolean),
          credentials: true,
        }
      : {},
  ),
);
app.use(express.json());
app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "1h" }));

type UserRow = {
  id: string;
  handle: string;
  name: string;
  avatar_emoji: string;
  balance_cents: number;
  escrowed_cents: number;
};

type TaskRow = {
  id: string;
  company_id: string;
  poster_id: string;
  title: string;
  description: string;
  category: string;
  payout_cents: number;
  deadline: string | null;
  status: "open" | "completed" | "cancelled";
  created_at: string;
};

type CompanyRow = {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  avatar_emoji: string;
  created_at: string;
};

type AttachmentRow = {
  id: string;
  parent_kind: "task" | "submission";
  parent_id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  stored_path: string;
  uploaded_by: string;
  uploaded_at: string;
};

function listAttachments(parentKind: "task" | "submission", parentId: string) {
  const rows = db
    .prepare(
      "SELECT * FROM attachments WHERE parent_kind = ? AND parent_id = ? ORDER BY uploaded_at ASC"
    )
    .all(parentKind, parentId) as AttachmentRow[];
  return rows.map((a) => ({
    id: a.id,
    parentKind: a.parent_kind,
    parentId: a.parent_id,
    filename: a.filename,
    mimeType: a.mime_type,
    sizeBytes: a.size_bytes,
    url: `/uploads/${a.stored_path}`,
    uploadedBy: a.uploaded_by,
    uploadedAt: a.uploaded_at,
  }));
}

type SubmissionRow = {
  id: string;
  task_id: string;
  worker_id: string;
  proof_text: string;
  proof_link: string | null;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
  reviewed_at: string | null;
};

const getUser = db.prepare("SELECT * FROM users WHERE id = ?");
const allUsers = db.prepare("SELECT id, handle, name, avatar_emoji, balance_cents, escrowed_cents FROM users ORDER BY handle");

function dollars(cents: number) {
  return cents / 100;
}

function serializeUser(u: UserRow) {
  return {
    id: u.id,
    handle: u.handle,
    name: u.name,
    avatarEmoji: u.avatar_emoji,
    balance: dollars(u.balance_cents),
    escrowed: dollars(u.escrowed_cents),
  };
}

const getCompany = db.prepare("SELECT * FROM companies WHERE id = ?");

function serializeCompany(c: CompanyRow) {
  const owner = getUser.get(c.owner_id) as UserRow | undefined;
  return {
    id: c.id,
    ownerId: c.owner_id,
    owner: owner
      ? { id: owner.id, handle: owner.handle, name: owner.name, avatarEmoji: owner.avatar_emoji }
      : null,
    name: c.name,
    description: c.description,
    avatarEmoji: c.avatar_emoji,
    createdAt: c.created_at,
  };
}

function serializeTask(t: TaskRow) {
  const poster = getUser.get(t.poster_id) as UserRow | undefined;
  const company = getCompany.get(t.company_id) as CompanyRow | undefined;
  return {
    id: t.id,
    companyId: t.company_id,
    company: company ? serializeCompany(company) : null,
    posterId: t.poster_id,
    poster: poster
      ? { id: poster.id, handle: poster.handle, name: poster.name, avatarEmoji: poster.avatar_emoji }
      : null,
    title: t.title,
    description: t.description,
    category: t.category,
    payout: dollars(t.payout_cents),
    deadline: t.deadline,
    status: t.status,
    createdAt: t.created_at,
    attachments: listAttachments("task", t.id),
  };
}

function serializeSubmission(s: SubmissionRow) {
  const worker = getUser.get(s.worker_id) as UserRow | undefined;
  return {
    id: s.id,
    taskId: s.task_id,
    workerId: s.worker_id,
    worker: worker
      ? { id: worker.id, handle: worker.handle, name: worker.name, avatarEmoji: worker.avatar_emoji }
      : null,
    proofText: s.proof_text,
    proofLink: s.proof_link,
    status: s.status,
    submittedAt: s.submitted_at,
    reviewedAt: s.reviewed_at,
    attachments: listAttachments("submission", s.id),
  };
}

app.get("/api/me", (_req, res) => {
  const id = session.getCurrentUserId();
  const user = getUser.get(id) as UserRow | undefined;
  if (!user) return res.status(404).json({ error: "user not found" });
  res.json(serializeUser(user));
});

app.get("/api/users", (_req, res) => {
  const users = allUsers.all() as UserRow[];
  res.json(users.map(serializeUser));
});

app.post("/api/me/switch", (req, res) => {
  const { userId } = req.body ?? {};
  if (typeof userId !== "string") return res.status(400).json({ error: "userId required" });
  const u = getUser.get(userId) as UserRow | undefined;
  if (!u) return res.status(404).json({ error: "user not found" });
  session.setCurrentUserId(userId);
  res.json(serializeUser(u));
});

app.get("/api/companies", (req, res) => {
  const { ownerId } = req.query;
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (typeof ownerId === "string") {
    clauses.push("owner_id = ?");
    params.push(ownerId);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db
    .prepare(`SELECT * FROM companies ${where} ORDER BY created_at DESC`)
    .all(...params) as CompanyRow[];
  res.json(rows.map(serializeCompany));
});

app.get("/api/companies/:id", (req, res) => {
  const c = getCompany.get(req.params.id) as CompanyRow | undefined;
  if (!c) return res.status(404).json({ error: "company not found" });
  const tasks = db
    .prepare("SELECT * FROM tasks WHERE company_id = ? ORDER BY created_at DESC")
    .all(req.params.id) as TaskRow[];
  res.json({
    ...serializeCompany(c),
    tasks: tasks.map(serializeTask),
  });
});

app.post("/api/companies", (req, res) => {
  const { name, description, avatarEmoji } = req.body ?? {};
  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "name required" });
  }
  if (typeof description !== "string") {
    return res.status(400).json({ error: "description required" });
  }
  const ownerId = session.getCurrentUserId();
  const owner = getUser.get(ownerId) as UserRow | undefined;
  if (!owner) return res.status(404).json({ error: "user not found" });

  const id = `c-${randomUUID().slice(0, 8)}`;
  db.prepare(
    `INSERT INTO companies (id, owner_id, name, description, avatar_emoji)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    id,
    ownerId,
    name.trim(),
    description.trim(),
    typeof avatarEmoji === "string" && avatarEmoji.trim() ? avatarEmoji.trim() : "🏢"
  );

  const c = getCompany.get(id) as CompanyRow;
  res.status(201).json(serializeCompany(c));
});

app.get("/api/tasks", (req, res) => {
  const { posterId, companyId, status, claimableBy } = req.query;
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (typeof posterId === "string") {
    clauses.push("poster_id = ?");
    params.push(posterId);
  }
  if (typeof companyId === "string") {
    clauses.push("company_id = ?");
    params.push(companyId);
  }
  if (typeof status === "string") {
    clauses.push("status = ?");
    params.push(status);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db
    .prepare(`SELECT * FROM tasks ${where} ORDER BY created_at DESC`)
    .all(...params) as TaskRow[];

  let result = rows.map(serializeTask);
  if (typeof claimableBy === "string") {
    result = result.filter((t) => t.posterId !== claimableBy && t.status === "open");
  }
  res.json(result);
});

app.get("/api/tasks/:id", (req, res) => {
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id) as TaskRow | undefined;
  if (!task) return res.status(404).json({ error: "task not found" });
  const submissions = db
    .prepare("SELECT * FROM submissions WHERE task_id = ? ORDER BY submitted_at DESC")
    .all(req.params.id) as SubmissionRow[];
  res.json({
    ...serializeTask(task),
    submissions: submissions.map(serializeSubmission),
  });
});

app.post("/api/tasks", (req, res) => {
  const { companyId, title, description, category, payout, deadline } = req.body ?? {};
  if (typeof companyId !== "string" || !companyId) return res.status(400).json({ error: "companyId required" });
  if (typeof title !== "string" || !title.trim()) return res.status(400).json({ error: "title required" });
  if (typeof description !== "string" || !description.trim()) return res.status(400).json({ error: "description required" });
  const validCategories = ["Content", "Design", "Dev", "Social", "Research"];
  if (!validCategories.includes(category)) return res.status(400).json({ error: "invalid category" });
  const payoutNum = Number(payout);
  if (!Number.isFinite(payoutNum) || payoutNum <= 0) return res.status(400).json({ error: "payout must be > 0" });

  const company = getCompany.get(companyId) as CompanyRow | undefined;
  if (!company) return res.status(404).json({ error: "company not found" });

  const posterId = session.getCurrentUserId();
  if (company.owner_id !== posterId) {
    return res.status(403).json({ error: "you do not own this company" });
  }

  const payoutCents = Math.round(payoutNum * 100);
  const poster = getUser.get(posterId) as UserRow | undefined;
  if (!poster) return res.status(404).json({ error: "user not found" });
  if (poster.balance_cents < payoutCents) {
    return res.status(400).json({ error: `Insufficient balance. You have $${dollars(poster.balance_cents).toFixed(2)}.` });
  }

  const id = `t-${randomUUID().slice(0, 8)}`;
  const create = db.transaction(() => {
    db.prepare(
      `INSERT INTO tasks (id, company_id, poster_id, title, description, category, payout_cents, deadline, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open')`
    ).run(id, companyId, posterId, title.trim(), description.trim(), category, payoutCents, deadline?.trim() || null);

    db.prepare(
      `UPDATE users SET balance_cents = balance_cents - ?, escrowed_cents = escrowed_cents + ? WHERE id = ?`
    ).run(payoutCents, payoutCents, posterId);

    writeLedgerEntry({
      userId: posterId,
      kind: "task_funded",
      amountCents: -payoutCents,
      taskId: id,
      description: `Funded bounty for ${company.name}: ${title.trim()}`,
    });
  });
  create();

  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as TaskRow;
  res.status(201).json(serializeTask(task));
});

app.post("/api/tasks/:id/submissions", (req, res) => {
  const { proofText, proofLink } = req.body ?? {};
  if (typeof proofText !== "string" || !proofText.trim()) {
    return res.status(400).json({ error: "proofText required" });
  }

  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id) as TaskRow | undefined;
  if (!task) return res.status(404).json({ error: "task not found" });
  if (task.status !== "open") return res.status(400).json({ error: "task is not open" });

  const workerId = session.getCurrentUserId();
  if (workerId === task.poster_id) {
    return res.status(400).json({ error: "you can't submit to your own task" });
  }

  const existing = db
    .prepare("SELECT 1 FROM submissions WHERE task_id = ? AND worker_id = ? AND status IN ('pending','approved')")
    .get(req.params.id, workerId);
  if (existing) {
    return res.status(400).json({ error: "you already have an active submission for this task" });
  }

  const id = `s-${randomUUID().slice(0, 8)}`;
  db.prepare(
    `INSERT INTO submissions (id, task_id, worker_id, proof_text, proof_link, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`
  ).run(id, req.params.id, workerId, proofText.trim(), proofLink?.trim() || null);

  const sub = db.prepare("SELECT * FROM submissions WHERE id = ?").get(id) as SubmissionRow;
  res.status(201).json(serializeSubmission(sub));
});

app.post("/api/submissions/:id/approve", (req, res) => {
  const sub = db.prepare("SELECT * FROM submissions WHERE id = ?").get(req.params.id) as SubmissionRow | undefined;
  if (!sub) return res.status(404).json({ error: "submission not found" });
  if (sub.status !== "pending") return res.status(400).json({ error: "submission already reviewed" });

  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(sub.task_id) as TaskRow | undefined;
  if (!task) return res.status(404).json({ error: "task not found" });
  if (task.poster_id !== session.getCurrentUserId()) {
    return res.status(403).json({ error: "only the poster can approve" });
  }
  if (task.status !== "open") return res.status(400).json({ error: "task is not open" });

  const approve = db.transaction(() => {
    db.prepare("UPDATE submissions SET status='approved', reviewed_at=datetime('now') WHERE id = ?").run(sub.id);
    db.prepare("UPDATE tasks SET status='completed' WHERE id = ?").run(task.id);
    db.prepare("UPDATE users SET escrowed_cents = escrowed_cents - ? WHERE id = ?").run(task.payout_cents, task.poster_id);
    db.prepare("UPDATE users SET balance_cents = balance_cents + ? WHERE id = ?").run(task.payout_cents, sub.worker_id);
    db.prepare(
      "UPDATE submissions SET status='rejected', reviewed_at=datetime('now') WHERE task_id = ? AND status='pending' AND id != ?"
    ).run(task.id, sub.id);

    writeLedgerEntry({
      userId: sub.worker_id,
      kind: "task_payout",
      amountCents: task.payout_cents,
      taskId: task.id,
      submissionId: sub.id,
      counterpartyId: task.poster_id,
      description: `Payout for: ${task.title}`,
    });
  });
  approve();

  const updated = db.prepare("SELECT * FROM submissions WHERE id = ?").get(sub.id) as SubmissionRow;
  res.json(serializeSubmission(updated));
});

app.post("/api/submissions/:id/reject", (req, res) => {
  const sub = db.prepare("SELECT * FROM submissions WHERE id = ?").get(req.params.id) as SubmissionRow | undefined;
  if (!sub) return res.status(404).json({ error: "submission not found" });
  if (sub.status !== "pending") return res.status(400).json({ error: "submission already reviewed" });

  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(sub.task_id) as TaskRow | undefined;
  if (!task) return res.status(404).json({ error: "task not found" });
  if (task.poster_id !== session.getCurrentUserId()) {
    return res.status(403).json({ error: "only the poster can reject" });
  }

  db.prepare("UPDATE submissions SET status='rejected', reviewed_at=datetime('now') WHERE id = ?").run(sub.id);
  const updated = db.prepare("SELECT * FROM submissions WHERE id = ?").get(sub.id) as SubmissionRow;
  res.json(serializeSubmission(updated));
});

function insertAttachment(opts: {
  parentKind: "task" | "submission";
  parentId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storedPath: string;
  uploadedBy: string;
}) {
  const id = `a-${randomUUID().slice(0, 8)}`;
  db.prepare(
    `INSERT INTO attachments
       (id, parent_kind, parent_id, filename, mime_type, size_bytes, stored_path, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    opts.parentKind,
    opts.parentId,
    opts.filename,
    opts.mimeType,
    opts.sizeBytes,
    opts.storedPath,
    opts.uploadedBy
  );
  return id;
}

app.post("/api/tasks/:id/attachments", upload.array("files", 10), (req, res) => {
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id) as TaskRow | undefined;
  if (!task) return res.status(404).json({ error: "task not found" });
  const company = getCompany.get(task.company_id) as CompanyRow | undefined;
  if (!company) return res.status(404).json({ error: "company not found" });
  if (company.owner_id !== session.getCurrentUserId()) {
    return res.status(403).json({ error: "only the company owner can attach files" });
  }
  const files = (req.files as Express.Multer.File[]) ?? [];
  for (const f of files) {
    insertAttachment({
      parentKind: "task",
      parentId: task.id,
      filename: f.originalname,
      mimeType: f.mimetype,
      sizeBytes: f.size,
      storedPath: f.filename,
      uploadedBy: session.getCurrentUserId(),
    });
  }
  res.json({ attachments: listAttachments("task", task.id) });
});

app.post(
  "/api/submissions/:id/attachments",
  upload.array("files", 10),
  (req, res) => {
    const sub = db
      .prepare("SELECT * FROM submissions WHERE id = ?")
      .get(req.params.id) as SubmissionRow | undefined;
    if (!sub) return res.status(404).json({ error: "submission not found" });
    if (sub.worker_id !== session.getCurrentUserId()) {
      return res.status(403).json({ error: "only the submitter can attach files" });
    }
    const files = (req.files as Express.Multer.File[]) ?? [];
    for (const f of files) {
      insertAttachment({
        parentKind: "submission",
        parentId: sub.id,
        filename: f.originalname,
        mimeType: f.mimetype,
        sizeBytes: f.size,
        storedPath: f.filename,
        uploadedBy: session.getCurrentUserId(),
      });
    }
    res.json({ attachments: listAttachments("submission", sub.id) });
  }
);

app.get("/api/me/ledger", (_req, res) => {
  const userId = session.getCurrentUserId();
  const rows = db
    .prepare(
      `SELECT le.*, t.title as task_title, t.category as task_category
       FROM ledger_entries le
       LEFT JOIN tasks t ON t.id = le.task_id
       WHERE le.user_id = ?
       ORDER BY le.id DESC`
    )
    .all(userId) as Array<{
      id: number;
      user_id: string;
      kind: string;
      amount_cents: number;
      balance_after_cents: number;
      task_id: string | null;
      submission_id: string | null;
      counterparty_id: string | null;
      description: string;
      created_at: string;
      task_title: string | null;
      task_category: string | null;
    }>;
  res.json(
    rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      amount: dollars(r.amount_cents),
      balanceAfter: dollars(r.balance_after_cents),
      taskId: r.task_id,
      submissionId: r.submission_id,
      counterpartyId: r.counterparty_id,
      description: r.description,
      createdAt: r.created_at,
      taskTitle: r.task_title,
      taskCategory: r.task_category,
    }))
  );
});

app.get("/api/submissions", (req, res) => {
  const { workerId, posterId } = req.query;
  if (typeof workerId === "string") {
    const rows = db
      .prepare(
        `SELECT s.* FROM submissions s
         WHERE s.worker_id = ?
         ORDER BY s.submitted_at DESC`
      )
      .all(workerId) as SubmissionRow[];
    return res.json(
      rows.map((s) => {
        const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(s.task_id) as TaskRow;
        return { ...serializeSubmission(s), task: serializeTask(task) };
      })
    );
  }
  if (typeof posterId === "string") {
    const rows = db
      .prepare(
        `SELECT s.* FROM submissions s JOIN tasks t ON t.id = s.task_id
         WHERE t.poster_id = ?
         ORDER BY s.submitted_at DESC`
      )
      .all(posterId) as SubmissionRow[];
    return res.json(
      rows.map((s) => {
        const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(s.task_id) as TaskRow;
        return { ...serializeSubmission(s), task: serializeTask(task) };
      })
    );
  }
  res.status(400).json({ error: "workerId or posterId required" });
});

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
