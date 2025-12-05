import type { APIRoute } from 'astro';
import { ensureWasm, renderOgPng } from '../../../utils/og';

export const GET: APIRoute = async () => {
  await ensureWasm();
  const png = await renderOgPng({
    title: 'タグ一覧',
    subtitle: 'All Tags',
    bgImageUrl: null,
    siteName: 'sinta.fun',
  });
  return new Response(png, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' } });
};

