## Sinta — Astro Site

- Framework: Astro 6 + Vite
- Styling: Tailwind CSS v4
- Blog Content: Markdown files in `src/pages/blog/posts/`
- Deploy targets: GitHub Pages (workflow included), Cloudflare Workers Static Assets (wrangler scripts)

### Prerequisites
- Node.js 22.12.0 or newer
- npm 10+ (or your preferred package manager)

### Setup
1) Install dependencies
- `npm ci`

### Commands
- `npm run dev`: Start local dev server
- `npm run build`: Type-check and build to `dist/`
- `npm run preview`: Preview the production build
- `npm run lint`: Lint Astro and TypeScript files
- `npm test`: Run unit tests once
- `npm run test:watch`: Run unit tests in watch mode
- `npm run ci`: Run lint, tests, and the production build
- `npm run pages:dev`: Build and start the Cloudflare Workers local runtime
- `npm run pages:deploy`: Build and deploy with Cloudflare Workers Static Assets

### Deployment
- GitHub Pages: pushing to `master` triggers `.github/workflows/astro.yml` to build and deploy.
- Cloudflare: use `npm run pages:deploy` (requires Cloudflare account and `wrangler` auth).

### Notes
- Blog posts are managed as Markdown files in `src/pages/blog/posts/`. Each post should have frontmatter with `title`, `image`, `tags`, `pubDate`, and optionally `category` and `description`.
- The site uses Astro's static output, which can be deployed directly to GitHub Pages or Cloudflare Workers Static Assets.

### Misskey notes
- `/notes/` loads up to 100 notes in the browser and displays the latest 10 public original posts (excluding replies and Renotes/quotes).
- Configure the instance, user ID, and profile link in `src/config/misskey.ts`. The public API must allow cross-origin requests; no token or backend is used.
- Images are lazy-loaded. CW content is collapsed, and sensitive images are fetched only after the visitor reveals them. MFM is shown as plain text.
- Updates happen on page load or with the reload button. Failed updates preserve the current list; nothing is stored persistently.
