# cheminfo.dev

A personal blog about practical cheminformatics, molecular data, and reproducible computational workflows.

## Local development

```bash
pnpm install
pnpm dev
```

Run the complete production check with:

```bash
pnpm build
```

## Publishing a note

Add a Markdown or MDX file to `src/content/posts`. Every published note needs a title, description, publication date, author, and tags. See the existing notes for working examples.

Site identity and social links are configured in `astro-paper.config.ts`.

## Utterances comments

Article comments are backed by GitHub Issues through
[Utterances](https://utteranc.es/). The repository and optional issue label are
configured under `features.utterances` in `astro-paper.config.ts`.

Before publishing, make the repository public, enable GitHub Issues, and install
the [Utterances GitHub App](https://github.com/apps/utterances) for the
repository. Comments map to articles by pathname and follow the site's light or
dark theme. Add `hideComments: true` to an article's frontmatter to disable
comments for that article.

## Umami analytics

Umami is enabled when `site.umami.websiteId` is set in `astro-paper.config.ts`.
The `PUBLIC_UMAMI_*` variables remain fallbacks; copy `.env.example` to `.env`
for local testing, or add them to the hosting environment:

```dotenv
PUBLIC_UMAMI_WEBSITE_ID=your-website-id
PUBLIC_UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js
PUBLIC_UMAMI_DOMAINS=cheminfo.dev,www.cheminfo.dev
```

For a self-hosted instance, change `PUBLIC_UMAMI_SCRIPT_URL` and optionally set
`PUBLIC_UMAMI_HOST_URL`. To honor visitors' browser Do Not Track preference,
set `site.umami.doNotTrack` to `true`; it is disabled by default. The tracker
excludes query parameters from pageview URLs and collects Core Web Vitals.

To start an isolated Umami instance for local testing, run:

```bash
docker compose -f compose.umami.yaml up -d
```

Open `http://localhost:3000`, sign in with `admin` / `umami`, and create a
website. Then use its website ID with the local tracker:

```dotenv
PUBLIC_UMAMI_WEBSITE_ID=your-local-website-id
PUBLIC_UMAMI_SCRIPT_URL=http://localhost:3000/script.js
PUBLIC_UMAMI_HOST_URL=http://localhost:3000
PUBLIC_UMAMI_DOMAINS=localhost
```

Stop the test instance with
`docker compose -f compose.umami.yaml down`. Its database remains in a named
volume between runs.

Alongside automatic pageviews, the site records navigation, article and tag
opens, outbound links, downloads, social and share clicks, search terms, button
actions, code copies, image previews, article reading depth, and comment-section
views.

## Theme foundation

The site is built with Astro and Tailwind CSS on the open-source AstroPaper foundation. See `LICENSE` for licensing details.
