import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://cheminfo.dev/",
    title: "cheminfo.dev",
    description:
      "Practical cheminformatics, molecular data, and reproducible workflows.",
    author: "Anton Siomchen",
    profile: "https://www.linkedin.com/in/anton-siomchen/",
    ogImage: "og.png",
    lang: "en",
    timezone: "Europe/Warsaw",
    dir: "ltr",
    umami: {
      websiteId: "f901625a-6341-4170-8579-6a29bbfca2fb",
      scriptUrl: "https://umami.cheminfo.dev/script.js",
      // Opt in to honoring visitors' browser Do Not Track preference.
      doNotTrack: false,
    },
  },
  posts: {
    perPage: 4,
    perIndex: 4,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: true,
      url: "https://github.com/asiomchen/cheminfo.dev/edit/main/",
    },
    search: "pagefind",
    utterances: {
      repo: "asiomchen/cheminfo.dev",
      label: "blog-comment",
    },
  },
  socials: [
    {
      name: "github",
      url: "https://github.com/asiomchen",
      linkTitle: "Anton Siomchen on GitHub",
    },
    {
      name: "linkedin",
      url: "https://www.linkedin.com/in/anton-siomchen/",
      linkTitle: "Anton Siomchen on LinkedIn",
    },
  ],
  shareLinks: [
    { name: "whatsapp", url: "https://wa.me/?text=" },
    { name: "facebook", url: "https://www.facebook.com/sharer.php?u=" },
    { name: "x",        url: "https://x.com/intent/post?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "pinterest", url: "https://pinterest.com/pin/create/button/?url=" },
    { name: "mail",     url: "mailto:?subject=See%20this%20post&body=" },
  ],
});
