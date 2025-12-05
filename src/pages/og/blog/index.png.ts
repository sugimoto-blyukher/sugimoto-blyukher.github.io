import type { APIRoute } from 'astro';
import { ensureWasm, renderOgPng } from '../../../utils/og';

export const GET: APIRoute = async () => {
  await ensureWasm();
  const png = await renderOgPng({
    title: 'Blog',
    subtitle: '最新の記事一覧',
    bgImageUrl: null,
    siteName: 'sinta.fun',
  });
  return new Response(png, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' } });
};

