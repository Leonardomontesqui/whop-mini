"use client";

import { useRef, useState } from "react";
import { Paperclip, X, FileText, Image as ImageIcon } from "lucide-react";
import { formatBytes } from "@/lib/api";

type Props = {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  label?: string;
};

export function AttachmentPicker({
  files,
  onChange,
  maxFiles = 10,
  label = "Attach files",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  function addFiles(incoming: FileList | File[]) {
    const merged = [...files, ...Array.from(incoming)].slice(0, maxFiles);
    onChange(merged);
  }

  function removeAt(i: number) {
    onChange(files.filter((_, idx) => idx !== i));
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
        }}
        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 border-dashed transition-colors text-sm w-full ${
          drag
            ? "border-[#ff5c1f] bg-[#ff5c1f]/5 text-[#ff5c1f]"
            : "border-[#26262a] bg-[#0f0f11] text-zinc-400 hover:border-[#3a3a40] hover:text-zinc-300"
        }`}
      >
        <Paperclip size={15} />
        <span>
          {label}{" "}
          <span className="text-zinc-500">
            (drag &amp; drop, images & docs, 10 MB max)
          </span>
        </span>
      </button>

      {files.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {files.map((f, i) => (
            <FileChip key={`${f.name}-${i}`} file={f} onRemove={() => removeAt(i)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function FileChip({ file, onRemove }: { file: File; onRemove: () => void }) {
  const isImg = file.type.startsWith("image/");
  const [thumb, setThumb] = useState<string | null>(null);

  if (isImg && thumb === null) {
    const url = URL.createObjectURL(file);
    setThumb(url);
  }

  return (
    <li className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#141416] border border-[#26262a]">
      {isImg && thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb}
          alt={file.name}
          className="w-8 h-8 rounded object-cover"
        />
      ) : isImg ? (
        <div className="w-8 h-8 rounded bg-[#1f1f23] flex items-center justify-center">
          <ImageIcon size={14} className="text-zinc-400" />
        </div>
      ) : (
        <div className="w-8 h-8 rounded bg-[#1f1f23] flex items-center justify-center">
          <FileText size={14} className="text-zinc-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-zinc-200 truncate">{file.name}</div>
        <div className="text-[10px] text-zinc-500">{formatBytes(file.size)}</div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="text-zinc-500 hover:text-red-400 p-1"
        aria-label="Remove"
      >
        <X size={14} />
      </button>
    </li>
  );
}
