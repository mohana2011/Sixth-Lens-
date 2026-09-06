'use client';

import { useRef, useState } from 'react';
import type { AdminPhoto } from './GalleryManager';

const CONCURRENCY = 3;

type Status = 'pending' | 'uploading' | 'done' | 'error';
type QueueItem = { key: string; file: File; progress: number; status: Status; error?: string };

function uploadOne(galleryId: string, file: File, onProgress: (pct: number) => void): Promise<AdminPhoto> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/galleries/${galleryId}/photos`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText).photo);
        } catch {
          reject(new Error('Bad response from server'));
        }
      } else {
        try {
          reject(new Error(JSON.parse(xhr.responseText).error || `Upload failed (${xhr.status})`));
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(form);
  });
}

export default function Uploader({
  galleryId,
  onUploaded,
}: {
  galleryId: string;
  onUploaded: (photo: AdminPhoto) => void;
}) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Mirrors `items` for synchronous reads inside startNext, so concurrent
  // calls never race on stale React state.
  const queueRef = useRef<QueueItem[]>([]);
  const activeCount = useRef(0);

  function patchItem(key: string, patch: Partial<QueueItem>) {
    queueRef.current = queueRef.current.map((it) => (it.key === key ? { ...it, ...patch } : it));
    setItems(queueRef.current);
  }

  function startNext() {
    if (activeCount.current >= CONCURRENCY) return;
    const next = queueRef.current.find((it) => it.status === 'pending');
    if (!next) return;

    activeCount.current += 1;
    patchItem(next.key, { status: 'uploading' });

    uploadOne(galleryId, next.file, (pct) => patchItem(next.key, { progress: pct }))
      .then((photo) => {
        patchItem(next.key, { status: 'done', progress: 100 });
        onUploaded(photo);
      })
      .catch((err: Error) => {
        patchItem(next.key, { status: 'error', error: err.message });
      })
      .finally(() => {
        activeCount.current -= 1;
        startNext();
      });
  }

  function enqueue(files: FileList | File[]) {
    const newItems: QueueItem[] = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((f) => ({
        key: `${f.name}-${f.size}-${Math.random().toString(36).slice(2)}`,
        file: f,
        progress: 0,
        status: 'pending',
      }));
    if (newItems.length === 0) return;

    queueRef.current = [...queueRef.current, ...newItems];
    setItems(queueRef.current);
    for (let i = 0; i < CONCURRENCY; i++) startNext();
  }

  const pendingOrActive = items.filter((it) => it.status === 'pending' || it.status === 'uploading');
  const done = items.filter((it) => it.status === 'done').length;
  const errors = items.filter((it) => it.status === 'error');

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files) enqueue(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`min-touch flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition ${
          dragOver ? 'border-ink bg-ink/5' : 'border-line hover:border-ink/40'
        }`}
      >
        <p className="text-sm text-ink/70">Drag & drop photos here, or click to select</p>
        <p className="mt-1 text-xs text-ink/40">JPEG, PNG, WebP — uploads run {CONCURRENCY} at a time</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && enqueue(e.target.files)}
        />
      </div>

      {items.length > 0 && (
        <div className="mt-4 space-y-1">
          <p className="text-xs text-ink/50">
            {done} / {items.length} uploaded
            {pendingOrActive.length > 0 && ` — ${pendingOrActive.length} remaining`}
            {errors.length > 0 && ` — ${errors.length} failed`}
          </p>
          <div className="max-h-40 overflow-y-auto rounded-lg border border-line">
            {items.map((item) => (
              <div key={item.key} className="flex items-center gap-2 border-b border-line/60 px-3 py-1.5 text-xs last:border-b-0">
                <span className="flex-1 truncate">{item.file.name}</span>
                {item.status === 'error' ? (
                  <span className="text-red-500">{item.error}</span>
                ) : item.status === 'done' ? (
                  <span className="text-green-600">Done</span>
                ) : (
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-line">
                    <div className="h-full bg-ink transition-all" style={{ width: `${item.progress}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
