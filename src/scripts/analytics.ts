type EventData = Record<string, string | number | boolean>;

type UmamiWindow = Window & {
  umami?: {
    track: (name: string, data?: EventData) => void;
  };
  __cheminfoAnalyticsReady?: boolean;
};

const analyticsWindow = window as UmamiWindow;
const DOWNLOAD_PATTERN =
  /\.(?:csv|docx?|dmg|exe|gz|iso|mp3|mp4|pdf|pptx?|rar|tar|xlsx?|zip)$/i;
const DEPTH_MARKS = [25, 50, 75, 100] as const;

function track(name: string, data: EventData = {}): void {
  analyticsWindow.umami?.track(name, data);
}

function labelFor(element: HTMLElement): string {
  return (
    element.getAttribute("aria-label") ||
    element.getAttribute("title") ||
    element.textContent ||
    "unlabelled"
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function areaFor(element: Element): string {
  if (element.closest("#pagefind-search")) return "search";
  if (element.closest("#comments")) return "comments";
  if (element.closest("header")) return "header";
  if (element.closest("footer")) return "footer";
  if (element.closest("#article")) return "article";
  if (element.closest("nav")) return "navigation";
  return "content";
}

function trackLink(anchor: HTMLAnchorElement): void {
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("javascript:")) return;

  const area = areaFor(anchor);
  const label = labelFor(anchor);

  if (href.startsWith("#")) {
    track("anchor-click", { area, label, target: href.slice(0, 120) });
    return;
  }

  const url = new URL(anchor.href, window.location.href);
  const fileName = url.pathname.split("/").filter(Boolean).at(-1) ?? "file";

  if (anchor.hasAttribute("download") || DOWNLOAD_PATTERN.test(url.pathname)) {
    track("file-download", { area, file: fileName.slice(0, 120) });
    return;
  }

  if (
    url.protocol === "mailto:" ||
    url.protocol === "tel:" ||
    url.origin !== window.location.origin
  ) {
    track("outbound-link", {
      area,
      label,
      target:
        url.protocol === "mailto:" || url.protocol === "tel:"
          ? url.protocol.slice(0, -1)
          : `${url.origin}${url.pathname}`.slice(0, 500),
    });
    return;
  }

  const path = url.pathname;
  if (area === "search") {
    track("search-result-click", { label, path });
  } else if (/\/posts\/[^/]+\/?$/.test(path)) {
    track("post-open", { area, label, path });
  } else if (/\/tags\/[^/]+\/?$/.test(path)) {
    track("tag-open", { area, label, path });
  } else {
    track("navigation-click", { area, label, path });
  }
}

function handleClick(event: MouseEvent): void {
  if (!(event.target instanceof Element)) return;

  // Umami handles explicitly annotated controls itself.
  if (event.target.closest("[data-umami-event]")) return;

  const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
  if (anchor) {
    trackLink(anchor);
    return;
  }

  const button = event.target.closest<HTMLElement>("button, [role='button']");
  if (button) {
    track("button-click", {
      area: areaFor(button),
      label: labelFor(button),
    });
  }
}

function handleSubmit(event: SubmitEvent): void {
  if (!(event.target instanceof HTMLFormElement)) return;
  track("form-submit", {
    area: areaFor(event.target),
    form: event.target.getAttribute("aria-label") || event.target.id || "form",
  });
}

let searchTimer: number | undefined;
function handleSearch(event: Event): void {
  const query = (
    event as CustomEvent<{ query?: string }>
  ).detail?.query?.trim();
  window.clearTimeout(searchTimer);
  if (!query || query.length < 2) return;

  searchTimer = window.setTimeout(() => {
    track("search", { query: query.slice(0, 100) });
  }, 800);
}

let depthPath = window.location.pathname;
let reachedDepths = new Set<number>();
let scrollTicking = false;

function checkArticleDepth(): void {
  scrollTicking = false;
  const article = document.querySelector<HTMLElement>("#article");
  if (!article) return;

  if (depthPath !== window.location.pathname) {
    depthPath = window.location.pathname;
    reachedDepths = new Set<number>();
  }

  const viewportBottom = window.scrollY + window.innerHeight;
  const articleTop = article.offsetTop;
  const depth = Math.min(
    100,
    Math.max(0, ((viewportBottom - articleTop) / article.offsetHeight) * 100)
  );

  for (const mark of DEPTH_MARKS) {
    if (depth >= mark && !reachedDepths.has(mark)) {
      reachedDepths.add(mark);
      track("article-depth", { depth: mark, path: depthPath });
    }
  }
}

function handleScroll(): void {
  if (scrollTicking) return;
  scrollTicking = true;
  window.requestAnimationFrame(checkArticleDepth);
}

let commentsObserver: IntersectionObserver | undefined;
const observedComments = new Set<string>();

function observeComments(): void {
  commentsObserver?.disconnect();
  const comments = document.querySelector("#comments");
  if (!comments) return;

  commentsObserver = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    const path = window.location.pathname;
    if (!observedComments.has(path)) {
      observedComments.add(path);
      track("comments-view", { path });
    }
    commentsObserver?.disconnect();
  });
  commentsObserver.observe(comments);
}

if (!analyticsWindow.__cheminfoAnalyticsReady) {
  analyticsWindow.__cheminfoAnalyticsReady = true;
  document.addEventListener("click", handleClick, true);
  document.addEventListener("submit", handleSubmit, true);
  document.addEventListener("site:search", handleSearch);
  document.addEventListener("scroll", handleScroll, { passive: true });
  document.addEventListener("astro:page-load", () => {
    observeComments();
    checkArticleDepth();
  });
  observeComments();
  checkArticleDepth();
}
