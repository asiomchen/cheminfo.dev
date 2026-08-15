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

## Theme foundation

The site is built with Astro and Tailwind CSS on the open-source AstroPaper foundation. See `LICENSE` for licensing details.
