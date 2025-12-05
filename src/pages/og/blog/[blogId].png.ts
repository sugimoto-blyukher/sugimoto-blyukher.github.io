import type { APIRoute } from 'astro';
import { getBlogDetail } from '../../../library/microcms';
import { ensureWasm, renderOgPng } from '../../../utils/og';

export const GET: APIRoute = async ({ params, site }) => {
  try {
    const id = params.blogId as string;
    if (!id) return new Response('Not found', { status: 404 });

    const blog = await getBlogDetail(id, { fields: ['id','title','eyecatch'] });
    const title = blog?.title || '記事';
    await ensureWasm();
    const pngData = await renderOgPng({
      title,
      subtitle: 'Blog',
      bgImageUrl: blog?.eyecatch?.url || null,
      siteName: 'sinta.fun'
    });
    return new Response(pngData, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' } });
  } catch (e) {
    return new Response('OG error', { status: 500 });
  }
};
