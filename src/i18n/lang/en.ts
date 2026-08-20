import type { UIStrings } from "../types";

export default {
  nav: {
    home: "Home",
    posts: "Blog",
    tags: "Topics",
    about: "About Me",
    archives: "Archives",
    search: "Search",
  },
  post: {
    publishedAt: "Published at",
    updatedAt: "Updated",
    sharePostIntro: "Share this post:",
    sharePostOn: "Share this post on {{platform}}",
    sharePostViaEmail: "Share this post via email",
    tagLabel: "Tags",
    backToTop: "Back to top",
    goBack: "Go back",
    editPage: "Edit page",
    previousPost: "Previous Post",
    nextPost: "Next Post",
  },
  pagination: {
    prev: "Prev",
    next: "Next",
    page: "Page",
  },
  home: {
    socialLinks: "Elsewhere",
    featured: "Featured analysis",
    recentPosts: "Latest field notes",
    allPosts: "Browse the blog",
  },
  footer: {
    copyright: "Copyright",
    allRightsReserved: "All rights reserved.",
  },
  pages: {
    tagTitle: "Topic",
    tagDesc: "Articles filed under",

    tagsTitle: "Topics",
    tagsDesc:
      "Browse the methods, tools, and data practices covered in the blog.",

    postsTitle: "Blog",
    postsDesc:
      "Practical notes on molecular data, cheminformatics tooling, and reproducible computational workflows.",

    archivesTitle: "Archives",
    archivesDesc: "A chronological index of every published field note.",

    searchTitle: "Search",
    searchDesc: "Search the full cheminfo.dev blog.",
  },
  a11y: {
    skipToContent: "Skip to content",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    toggleTheme: "Toggle theme",
    searchPlaceholder: "Search posts...",
    noResults: "No results found",
    goToPreviousPage: "Go to previous page",
    goToNextPage: "Go to next page",
  },
  notFound: {
    title: "404 Not Found",
    eyebrow: "Error 404 / Molecular match",
    heading: "Page not found.",
    message: "The page is missing, but Lesinurad weighs",
    compoundName: "Lesinurad",
    formula: "C₁₇H₁₄BrN₃O₂S",
    molecularWeightLabel: "Molecular weight",
    molecularWeight: "404.28 g·mol⁻¹",
    viewerLabel: "Interactive 3D model of the Lesinurad molecule",
    viewerLoading: "Preparing 3D conformer…",
    viewerError: "Interactive model unavailable",
    viewerHint: "Drag to rotate · Scroll to zoom",
    viewerPause: "Pause rotation",
    viewerPlay: "Start rotation",
    viewerReset: "Reset view",
    viewerSource: "3D conformer · PubChem CID 53465279",
    goHome: "Go back home",
  },
} satisfies UIStrings;
