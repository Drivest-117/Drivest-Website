const PRODUCTION_URL = "https://drivest.uk";
const DEFAULT_LOCAL_URL = "http://127.0.0.1:4173";
const NOINDEX_ROBOTS = "noindex,nofollow,noarchive,noimageindex,max-image-preview:none,max-snippet:0";
const INDEX_ROBOTS = "index,follow,max-image-preview:large";

export function resolveSiteEnvironment(env = process.env) {
  const explicitName = normalizeEnvironmentName(env.DRIVEST_ENV || env.SITE_ENV || "");
  const vercelName = normalizeEnvironmentName(env.VERCEL_ENV || "");
  const name = explicitName || vercelName || inferFallbackEnvironment(env);
  const siteUrl = resolveSiteUrl(name, env);
  const isProduction = name === "production";

  return {
    name,
    siteUrl,
    isProduction,
    isIndexable: isProduction,
    robotsMeta: isProduction ? INDEX_ROBOTS : NOINDEX_ROBOTS
  };
}

export function productionSiteUrl() {
  return PRODUCTION_URL;
}

function inferFallbackEnvironment(env) {
  if (env.CI) return "preview";
  return "local";
}

function normalizeEnvironmentName(value) {
  const lowered = String(value || "").trim().toLowerCase();
  if (!lowered) return "";
  if (lowered === "prod") return "production";
  if (lowered === "development") return "preview";
  if (lowered === "dev") return "preview";
  return lowered;
}

function resolveSiteUrl(name, env) {
  const explicitSiteUrl = normalizeSiteUrl(env.DRIVEST_SITE_URL || env.SITE_URL || "");
  if (explicitSiteUrl) return explicitSiteUrl;

  if (name === "production") {
    return PRODUCTION_URL;
  }

  const previewSiteUrl = normalizeSiteUrl(env.DRIVEST_DEV_SITE_URL || "");
  if (previewSiteUrl) return previewSiteUrl;

  const vercelUrl = String(env.VERCEL_URL || "").trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/^https?:\/\//i, "").replace(/\/+$/, "")}`;
  }

  return DEFAULT_LOCAL_URL;
}

function normalizeSiteUrl(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  return trimmed.replace(/\/+$/, "");
}
