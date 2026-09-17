import { misskey } from '../config/misskey';

export interface NoteFile {
  type: string;
  url: string;
  comment: string | null;
  isSensitive: boolean;
}

export interface Note {
  id: string;
  createdAt: string;
  text: string | null;
  cw: string | null;
  files: NoteFile[];
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nullableText(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function safeImageUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function parseNotes(value: unknown): Note[] {
  if (!Array.isArray(value)) throw new Error('Invalid notes response');
  const notes: Note[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (!record(item) || typeof item.id !== 'string' || !item.id ||
        typeof item.createdAt !== 'string' || !Number.isFinite(Date.parse(item.createdAt)) ||
        typeof item.userId !== 'string' || typeof item.visibility !== 'string' ||
        !nullableText(item.replyId) || !nullableText(item.renoteId) ||
        !nullableText(item.text) || !nullableText(item.cw) || !Array.isArray(item.files)) {
      throw new Error('Invalid note');
    }
    if (item.userId !== misskey.userId || item.visibility !== 'public' ||
        item.replyId !== null || item.renoteId !== null || seen.has(item.id)) continue;
    const files: NoteFile[] = item.files.map((file: unknown) => {
      if (!record(file) || typeof file.type !== 'string' || typeof file.url !== 'string' ||
          !nullableText(file.comment) || typeof file.isSensitive !== 'boolean') {
        throw new Error('Invalid attachment');
      }
      return {
        type: file.type,
        url: safeImageUrl(file.url) ? file.url : '',
        comment: file.comment,
        isSensitive: file.isSensitive,
      };
    });
    seen.add(item.id);
    notes.push({ id: item.id, createdAt: item.createdAt, text: item.text, cw: item.cw, files });
  }
  return notes.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, misskey.displayLimit);
}

export function noteUrl(id: string): string {
  return `${misskey.origin}/notes/${encodeURIComponent(id)}`;
}

export async function fetchNotes(request: typeof fetch = fetch): Promise<Note[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), misskey.timeoutMs);
  try {
    const response = await request(`${misskey.origin}/api/users/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
      cache: 'no-store',
      signal: controller.signal,
      body: JSON.stringify({
        userId: misskey.userId,
        limit: misskey.fetchLimit,
        withReplies: false,
        withRenotes: false,
      }),
    });
    if (!response.ok) throw new Error(`Misskey HTTP ${response.status}`);
    return parseNotes(await response.json());
  } finally {
    clearTimeout(timer);
  }
}
