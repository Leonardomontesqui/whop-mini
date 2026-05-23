export const API_BASE = "https://whop-mini-backend.onrender.com";

export type Me = {
  id: string;
  handle: string;
  name: string;
  avatarEmoji: string;
  balance: number;
  escrowed: number;
};

export type PosterRef = {
  id: string;
  handle: string;
  name: string;
  avatarEmoji: string;
};

export type Company = {
  id: string;
  ownerId: string;
  owner: PosterRef | null;
  name: string;
  description: string;
  avatarEmoji: string;
  createdAt: string;
};

export type CompanyWithTasks = Company & { tasks: Task[] };

export type Attachment = {
  id: string;
  parentKind: "task" | "submission";
  parentId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
};

export type Task = {
  id: string;
  companyId: string;
  company: Company | null;
  posterId: string;
  poster: PosterRef | null;
  title: string;
  description: string;
  category: "Content" | "Design" | "Dev" | "Social" | "Research";
  payout: number;
  deadline: string | null;
  status: "open" | "completed" | "cancelled";
  createdAt: string;
  attachments: Attachment[];
};

export type Submission = {
  id: string;
  taskId: string;
  workerId: string;
  worker: PosterRef | null;
  proofText: string;
  proofLink: string | null;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt: string | null;
  attachments: Attachment[];
};

export type TaskWithSubmissions = Task & { submissions: Submission[] };
export type SubmissionWithTask = Submission & { task: Task };

export type LedgerKind = "starting_balance" | "task_funded" | "task_refund" | "task_payout";
export type LedgerEntry = {
  id: number;
  kind: LedgerKind;
  amount: number;
  balanceAfter: number;
  taskId: string | null;
  submissionId: string | null;
  counterpartyId: string | null;
  description: string;
  createdAt: string;
  taskTitle: string | null;
  taskCategory: string | null;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  me: () => request<Me>("/api/me"),
  users: () => request<Me[]>("/api/users"),
  switchUser: (userId: string) =>
    request<Me>("/api/me/switch", { method: "POST", body: JSON.stringify({ userId }) }),

  listTasks: (q?: { posterId?: string; companyId?: string; status?: string; claimableBy?: string }) => {
    const params = new URLSearchParams();
    if (q?.posterId) params.set("posterId", q.posterId);
    if (q?.companyId) params.set("companyId", q.companyId);
    if (q?.status) params.set("status", q.status);
    if (q?.claimableBy) params.set("claimableBy", q.claimableBy);
    const qs = params.toString();
    return request<Task[]>(`/api/tasks${qs ? `?${qs}` : ""}`);
  },

  listCompanies: (q?: { ownerId?: string }) => {
    const params = new URLSearchParams();
    if (q?.ownerId) params.set("ownerId", q.ownerId);
    const qs = params.toString();
    return request<Company[]>(`/api/companies${qs ? `?${qs}` : ""}`);
  },
  getCompany: (id: string) => request<CompanyWithTasks>(`/api/companies/${id}`),
  createCompany: (body: { name: string; description: string; avatarEmoji?: string }) =>
    request<Company>("/api/companies", { method: "POST", body: JSON.stringify(body) }),

  getTask: (id: string) => request<TaskWithSubmissions>(`/api/tasks/${id}`),

  createTask: (body: {
    companyId: string;
    title: string;
    description: string;
    category: string;
    payout: number;
    deadline?: string;
  }) => request<Task>("/api/tasks", { method: "POST", body: JSON.stringify(body) }),

  submit: (taskId: string, body: { proofText: string; proofLink?: string }) =>
    request<Submission>(`/api/tasks/${taskId}/submissions`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  approve: (submissionId: string) =>
    request<Submission>(`/api/submissions/${submissionId}/approve`, { method: "POST" }),
  reject: (submissionId: string) =>
    request<Submission>(`/api/submissions/${submissionId}/reject`, { method: "POST" }),

  workerSubmissions: (workerId: string) =>
    request<SubmissionWithTask[]>(`/api/submissions?workerId=${workerId}`),
  posterSubmissions: (posterId: string) =>
    request<SubmissionWithTask[]>(`/api/submissions?posterId=${posterId}`),

  ledger: () => request<LedgerEntry[]>("/api/me/ledger"),

  uploadTaskAttachments: async (taskId: string, files: File[]) => {
    if (files.length === 0) return { attachments: [] as Attachment[] };
    const form = new FormData();
    for (const f of files) form.append("files", f);
    const res = await fetch(`${API_BASE}/api/tasks/${taskId}/attachments`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error ?? `upload failed (${res.status})`);
    }
    return res.json() as Promise<{ attachments: Attachment[] }>;
  },

  uploadSubmissionAttachments: async (submissionId: string, files: File[]) => {
    if (files.length === 0) return { attachments: [] as Attachment[] };
    const form = new FormData();
    for (const f of files) form.append("files", f);
    const res = await fetch(
      `${API_BASE}/api/submissions/${submissionId}/attachments`,
      { method: "POST", body: form }
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error ?? `upload failed (${res.status})`);
    }
    return res.json() as Promise<{ attachments: Attachment[] }>;
  },
};

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImage(mime: string) {
  return mime.startsWith("image/");
}

export function absoluteUrl(url: string) {
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url}`;
}

export function formatMoney(amount: number) {
  return `$${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
}
