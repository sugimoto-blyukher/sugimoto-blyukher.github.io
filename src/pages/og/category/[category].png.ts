import type { APIRoute } from 'astro';
import { ensureWasm, renderOgPng } from '../../../utils/og';

export const GET: APIRoute = async ({ params }) => {
  const category = params.category as string;
  await ensureWasm();
  const png = await renderOgPng({
    title: `Category: ${category}`,
    subtitle: 'カテゴリで絞り込み',
    bgImageUrl: null,
    siteName: 'sinta.fun',
  });
  return new Response(png, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' } });
};

