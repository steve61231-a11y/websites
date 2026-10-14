"use client";

import { FileText, Loader2, Upload, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createUploadUrl } from "@/actions/public";
import { cn } from "@/lib/cn";
import { messages } from "@/lib/validation/common";
import { isAllowedFile, type UploadedFile } from "@/lib/validation/application";
import { FieldError, fieldIds } from "./fields";
import type { TurnstileHandle } from "./Turnstile";

type InFlight = { id: string; name: string; progress: number; error?: string };

/** PUT a file to a signed upload URL with progress (fetch has no upload progress). */
function putWithProgress(url: string, file: File, onProgress: (p: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", file.type || "application/octet-stream");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("cache-control", "max-age=3600");
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (anon) xhr.setRequestHeader("apikey", anon);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(String(xhr.status))));
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(file);
  });
}

/**
 * Uploads straight to private storage through short-lived signed links
 * issued by the server (PRD 8.2). Shows a progress bar per file.
 */
export function FileUpload({
  name,
  label,
  hint,
  optional,
  multiple = false,
  max,
  draftId,
  value,
  onChange,
  turnstile,
  error,
}: {
  name: string;
  label: string;
  hint?: string;
  optional?: boolean;
  multiple?: boolean;
  max: number;
  draftId: string;
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  turnstile: React.RefObject<TurnstileHandle | null>;
  error?: string;
}) {
  const inputId = useId();
  const ids = fieldIds(name);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inFlight, setInFlight] = useState<InFlight[]>([]);
  const [localError, setLocalError] = useState<string | undefined>();
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);

  const upload = async (file: File) => {
    const id = `${file.name}-${file.size}-${Math.random()}`;
    const update = (patch: Partial<InFlight>) =>
      setInFlight((list) => list.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    setInFlight((list) => [...list, { id, name: file.name, progress: 0 }]);
    try {
      let token = "";
      try {
        token = (await turnstile.current?.getToken()) ?? "";
      } catch {
        throw new Error(messages.botCheck);
      }
      const res = await createUploadUrl({
        draftId,
        name: file.name,
        mime: file.type,
        size: file.size,
        turnstileToken: token || undefined,
      });
      if (!res.ok) throw new Error(res.error);
      await putWithProgress(res.signedUrl, file, (p) => update({ progress: p }));
      const nextFiles = [...latest.current, { path: res.path, name: file.name, mime: file.type, size: file.size }];
      latest.current = nextFiles;
      onChange(nextFiles);
      setInFlight((list) => list.filter((f) => f.id !== id));
    } catch (e) {
      const msg = e instanceof Error && e.message.length > 20 ? e.message : messages.network;
      update({ error: msg, progress: 0 });
    }
  };

  const onFiles = (files: FileList | null) => {
    setLocalError(undefined);
    if (!files) return;
    const room = max - latest.current.length - inFlight.filter((f) => !f.error).length;
    const chosen = Array.from(files).slice(0, Math.max(0, room));
    if (files.length > chosen.length) setLocalError(`You can upload up to ${max} ${max === 1 ? "file" : "files"}.`);
    for (const file of chosen) {
      if (!isAllowedFile(file.name, file.type, file.size)) {
        setLocalError(messages.file);
        continue;
      }
      void upload(file);
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const full = value.length >= max;
  const shownError = localError ?? error;

  return (
    <div>
      <p className="mb-2 text-[16px] font-semibold text-text" id={`${inputId}-label`}>
        {label}
        {optional && <span className="font-normal text-text-2"> (optional)</span>}
      </p>
      {hint && <p className="-mt-1 mb-3 text-[15px] text-text-2">{hint}</p>}

      {(value.length > 0 || inFlight.length > 0) && (
        <ul className="mb-3 flex flex-col gap-2" aria-live="polite">
          {value.map((f) => (
            <li key={f.path} className="flex items-center gap-3 rounded-[14px] border border-input-border bg-paper px-4 py-3">
              <FileText aria-hidden="true" size={20} strokeWidth={1.5} className="shrink-0 text-green-700" />
              <span className="min-w-0 flex-1 truncate">{f.name}</span>
              <span className="type-small text-text-2 tabular">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v.path !== f.path))}
                className="grid size-11 place-items-center rounded-full hover:bg-canvas"
                aria-label={`Remove ${f.name}`}
              >
                <X aria-hidden="true" size={18} />
              </button>
            </li>
          ))}
          {inFlight.map((f) => (
            <li key={f.id} className="rounded-[14px] border border-input-border bg-paper px-4 py-3">
              <div className="flex items-center gap-3">
                {f.error ? (
                  <X aria-hidden="true" size={20} className="shrink-0 text-orange-700" />
                ) : (
                  <Loader2 aria-hidden="true" size={20} className="shrink-0 animate-spin text-green-700" />
                )}
                <span className="min-w-0 flex-1 truncate">{f.name}</span>
                {f.error ? (
                  <button
                    type="button"
                    onClick={() => setInFlight((list) => list.filter((x) => x.id !== f.id))}
                    className="grid size-11 place-items-center rounded-full hover:bg-canvas"
                    aria-label={`Dismiss ${f.name}`}
                  >
                    <X aria-hidden="true" size={18} />
                  </button>
                ) : (
                  <span className="type-small text-text-2 tabular">{f.progress}%</span>
                )}
              </div>
              {f.error ? (
                <p className="mt-2 text-[15px] text-orange-700">{f.error}</p>
              ) : (
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas"
                  role="progressbar"
                  aria-label={`Uploading ${f.name}`}
                  aria-valuenow={f.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="h-full origin-left rounded-full bg-green-600 transition-transform" style={{ transform: `scaleX(${f.progress / 100})` }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {!full && (
        <label
          htmlFor={ids.input}
          className={cn(
            "press flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-dashed border-input-border bg-paper px-4 font-semibold text-green-700",
            "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-green-600",
          )}
        >
          <Upload aria-hidden="true" size={20} strokeWidth={1.5} />
          {multiple ? "Choose files" : "Choose a file"}
          <span className="sr-only">for {label}</span>
          <input
            ref={inputRef}
            id={ids.input}
            type="file"
            className="sr-only"
            multiple={multiple}
            accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,application/pdf,image/jpeg,image/png,image/heic,image/heif"
            aria-describedby={shownError ? ids.error : undefined}
            aria-invalid={shownError ? true : undefined}
            onChange={(e) => onFiles(e.target.files)}
          />
        </label>
      )}
      <p className="mt-2 type-small text-text-2">PDF, JPG, PNG or HEIC, up to 10 MB each.</p>
      <FieldError id={ids.error} message={shownError} />
    </div>
  );
}
