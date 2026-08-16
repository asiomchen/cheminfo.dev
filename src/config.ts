/**
 * Internal resolved configuration used throughout the codebase.
 *
 * Prefer editing `astro-paper.config.ts` instead of this file. This module exists to
 * apply defaults and expose a fully-resolved config shape (`ResolvedAstroPaperConfig`).
 */
import userConfig from "@/astro-paper.config";
import type { ResolvedAstroPaperConfig } from "./types/config";
import {
  PUBLIC_GOOGLE_SITE_VERIFICATION,
  PUBLIC_UMAMI_DOMAINS,
  PUBLIC_UMAMI_HOST_URL,
  PUBLIC_UMAMI_SCRIPT_URL,
  PUBLIC_UMAMI_WEBSITE_ID,
} from "astro:env/client";

const DEFAULT_OG_IMAGE = "og.png";

const config: ResolvedAstroPaperConfig = {
  site: {
    ...userConfig.site,
    ogImage: userConfig.site.ogImage ?? DEFAULT_OG_IMAGE,
    lang: userConfig.site.lang ?? "en",
    timezone: userConfig.site.timezone ?? "UTC",
    dir: userConfig.site.dir ?? "ltr",
    googleVerification:
      userConfig.site.googleVerification || PUBLIC_GOOGLE_SITE_VERIFICATION,
    umami: {
      websiteId: userConfig.site.umami?.websiteId || PUBLIC_UMAMI_WEBSITE_ID,
      scriptUrl: userConfig.site.umami?.scriptUrl || PUBLIC_UMAMI_SCRIPT_URL,
      hostUrl: userConfig.site.umami?.hostUrl || PUBLIC_UMAMI_HOST_URL,
      domains: userConfig.site.umami?.domains || PUBLIC_UMAMI_DOMAINS,
      doNotTrack: userConfig.site.umami?.doNotTrack ?? false,
    },
  },
  posts: {
    perPage: userConfig.posts?.perPage ?? 4,
    perIndex: userConfig.posts?.perIndex ?? 4,
    scheduledPostMargin:
      userConfig.posts?.scheduledPostMargin ?? 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: userConfig.features?.lightAndDarkMode ?? true,
    dynamicOgImage: userConfig.features?.dynamicOgImage ?? true,
    showArchives: userConfig.features?.showArchives ?? true,
    showBackButton: userConfig.features?.showBackButton ?? true,
    editPost: userConfig.features?.editPost ?? { enabled: false },
    search: userConfig.features?.search ?? "pagefind",
    utterances: userConfig.features?.utterances ?? false,
  },
  socials: userConfig.socials ?? [],
  shareLinks: userConfig.shareLinks ?? [],
};

export default config;
