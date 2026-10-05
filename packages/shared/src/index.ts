export * from './api';

/**
 * Resolve an image URL to an absolute one, given a base API URL.
 *
 * - Absolute URLs (starting with http:// or https://) are returned unchanged.
 * - Relative paths (e.g. "/storage/campsites/foo.jpg") are prefixed with
 *   the API host (derived from `apiBase` by stripping the trailing "/api").
 * - null/empty input returns null.
 */
export function resolveImageUrl(
  url: string | null | undefined,
  apiBase: string,
): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const host = apiBase.replace(/\/api\/?$/, '');
  const prefix = url.startsWith('/') ? '' : '/';
  return `${host}${prefix}${url}`;
}