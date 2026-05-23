"use client";

import { FileText, ExternalLink } from "lucide-react";
import { absoluteUrl, formatBytes, isImage, type Attachment } from "@/lib/api";

export function AttachmentList({
  attachments,
  title = "Attachments",
}: {
  attachments: Attachment[];
  title?: string;
}) {
  if (attachments.length === 0) return null;

  const images = attachments.filter((a) => isImage(a.mimeType));
  const docs = attachments.filter((a) => !isImage(a.mimeType));

  return (
    <div className="mt-4">
      <div className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-2">
        {title} · {attachments.length}
      </div>

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {images.map((a) => (
            <a
              key={a.id}
              href={absoluteUrl(a.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-24 h-24 rounded-lg overflow-hidden border border-[#26262a] hover:border-[#ff5c1f] transition-colors"
              title={`${a.filename} · ${formatBytes(a.sizeBytes)}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={absoluteUrl(a.url)}
                alt={a.filename}
                className="w-full h-full object-cover"
              />
            </a>
          ))}
        </div>
      )}

      {docs.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {docs.map((a) => (
            <li key={a.id}>
              <a
                href={absoluteUrl(a.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#141416] border border-[#26262a] hover:border-[#3a3a40] group"
              >
                <div className="w-9 h-9 rounded-md bg-[#1f1f23] flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-zinc-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-zinc-100 truncate">{a.filename}</div>
                  <div className="text-[11px] text-zinc-500">
                    {a.mimeType} · {formatBytes(a.sizeBytes)}
                  </div>
                </div>
                <ExternalLink
                  size={14}
                  className="text-zinc-500 group-hover:text-zinc-200 shrink-0"
                />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
