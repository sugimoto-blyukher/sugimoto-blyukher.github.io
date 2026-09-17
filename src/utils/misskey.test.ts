import { afterEach, describe, expect, it, vi } from 'vitest';
import { misskey } from '../config/misskey';
import { fetchNotes, parseNotes } from './misskey';

const note = (extra = {}) => ({
  id: 'one', userId: misskey.userId, createdAt: '2026-09-17T02:06:53.594Z',
  text: '<script>alert(1)</script>\nhello', cw: null, visibility: 'public',
  replyId: null, renoteId: null, files: [], ...extra,
});

afterEach(() => vi.useRealTimers());

describe('Misskey notes', () => {
  it('only includes this user’s public original notes', () => {
    const excluded = [
      { visibility: 'home' }, { visibility: 'followers' }, { visibility: 'specified' },
      { replyId: 'reply' }, { renoteId: 'renote', text: null },
      { renoteId: 'quote', text: 'comment' }, { userId: 'someone-else' },
    ];
    expect(parseNotes([note(), ...excluded.map((extra, i) => note({ id: String(i), ...extra }))]))
      .toEqual([expect.objectContaining({ id: 'one', text: '<script>alert(1)</script>\nhello' })]);
  });

  it('sorts newest first, deduplicates and limits to ten', () => {
    const notes = Array.from({ length: 15 }, (_, i) => note({
      id: String(i), createdAt: new Date(Date.UTC(2026, 8, i + 1)).toISOString(),
    }));
    const result = parseNotes([...notes, notes[14]]);
    expect(result.map(n => n.id)).toEqual(['14', '13', '12', '11', '10', '9', '8', '7', '6', '5']);
    expect(parseNotes([])).toEqual([]);
  });

  it.each([{}, null, [null], [note({ createdAt: 'bad' })], [note({ files: [{}] })], [note({ text: {} })]])('rejects malformed responses: %j', value => {
      expect(() => parseNotes(value)).toThrow();
    });

  it('preserves CW and attachment sensitivity and rejects unsafe image URLs', () => {
    const result = parseNotes([note({ text: null, cw: '', files: [
      { type: 'image/png', url: 'https://example.com/a.png', comment: '説明', isSensitive: true },
      { type: 'image/png', url: 'javascript:alert(1)', comment: null, isSensitive: false },
    ] })])[0];
    expect(result.cw).toBe('');
    expect(result.files[0]).toEqual(expect.objectContaining({ isSensitive: true, comment: '説明' }));
    expect(result.files[1].url).toBe('');
  });

  it('fetches without credentials using the configured limit', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify([note()])));
    expect(await fetchNotes(request)).toHaveLength(1);
    expect(request).toHaveBeenCalledWith(`${misskey.origin}/api/users/notes`, expect.objectContaining({
      credentials: 'omit', method: 'POST', body: JSON.stringify({
        userId: misskey.userId, limit: 100, withReplies: false, withRenotes: false,
      }),
    }));
  });

  it('reports HTTP, network and invalid JSON failures', async () => {
    await expect(fetchNotes(vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 429 })))).rejects.toThrow('429');
    await expect(fetchNotes(vi.fn<typeof fetch>().mockRejectedValue(new TypeError('offline')))).rejects.toThrow('offline');
    await expect(fetchNotes(vi.fn<typeof fetch>().mockResolvedValue(new Response('not json')))).rejects.toThrow();
  });

  it('aborts requests after ten seconds', async () => {
    vi.useFakeTimers();
    const request = vi.fn<typeof fetch>().mockImplementation((_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    }));
    const pending = expect(fetchNotes(request)).rejects.toThrow('Aborted');
    await vi.advanceTimersByTimeAsync(10_000);
    await pending;
    expect(vi.getTimerCount()).toBe(0);
  });
});
