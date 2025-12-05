import satori from 'satori';
import initWasm, { Resvg } from '@resvg/resvg-wasm';
import wasmUrl from '@resvg/resvg-wasm/index_bg.wasm?url';
import fontUrl from '../assets/fonts/NotoSansJP-Regular.ttf?url';

let wasmInitialized = false;
let fontCache: ArrayBuffer | null = null;

export async function ensureWasm() {
  if (!wasmInitialized) {
    const res = await fetch(wasmUrl);
    const buf = await res.arrayBuffer();
    await initWasm(buf);
    wasmInitialized = true;
  }
}

export async function getFont(): Promise<ArrayBuffer> {
  if (fontCache) return fontCache;
  const res = await fetch(fontUrl);
  fontCache = await res.arrayBuffer();
  return fontCache;
}

export type OgOptions = {
  title: string;
  subtitle?: string;
  width?: number;
  height?: number;
  bgImageUrl?: string | null;
  siteName?: string;
};

export async function renderOgPng(opts: OgOptions): Promise<Uint8Array> {
  const width = opts.width ?? 1200;
  const height = opts.height ?? 630;
  await ensureWasm();
  const fontData = await getFont();

  let bgDataUrl: string | undefined;
  if (opts.bgImageUrl) {
    try {
      const r = await fetch(opts.bgImageUrl);
      const a = new Uint8Array(await r.arrayBuffer());
      const b64 = typeof Buffer !== 'undefined' ? Buffer.from(a).toString('base64') : btoa(String.fromCharCode(...a));
      const mime = r.headers.get('Content-Type') || 'image/jpeg';
      bgDataUrl = `data:${mime};base64,${b64}`;
    } catch {}
  }

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: `${width}px`,
          height: `${height}px`,
          display: 'flex',
          position: 'relative',
          padding: '48px',
          color: '#fff',
          background: 'linear-gradient(135deg,#111827 0%,#1f2937 50%,#4f46e5 100%)',
        },
        children: [
          // Background image layer
          bgDataUrl ? {
            type: 'img',
            props: {
              src: bgDataUrl,
              style: {
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.25,
                filter: 'grayscale(30%)',
              },
            },
          } : null,
          // Overlay gradient
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.2), rgba(0,0,0,0.55))',
              },
            },
          },
          // Foreground content
          {
            type: 'div',
            props: {
              style: { position: 'relative', display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' },
              children: [
                {
                  type: 'div',
                  props: {
                    style: { display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.95 },
                    children: [
                      { type: 'div', props: { style: { width: '14px', height: '14px', borderRadius: '9999px', background: '#60a5fa' } } },
                      { type: 'div', props: { style: { fontSize: '24px', fontWeight: 700, letterSpacing: '0.02em' }, children: opts.siteName || 'sinta.fun' } },
                    ],
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '56px', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.01em', wordBreak: 'break-word',
                      textShadow: '0 2px 8px rgba(0,0,0,0.45)'
                    },
                    children: opts.title,
                  },
                },
                opts.subtitle ? {
                  type: 'div',
                  props: {
                    style: { marginTop: 'auto', fontSize: '22px', opacity: 0.9 },
                    children: opts.subtitle,
                  },
                } : null,
              ],
            },
          },
        ],
      },
    },
    {
      width,
      height,
      fonts: [
        { name: 'NotoSansJP', data: fontData, weight: 400, style: 'normal' },
      ],
    }
  );

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width } });
  return resvg.render().asPng();
}

