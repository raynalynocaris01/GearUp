import { resolveImageUrl } from '@gearup/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

/**
 * Turn a stored image_url (absolute, relative, or local browser URI) into an
 * absolute URL suitable for <img src={...}>.
 *
 * Local browser URIs (blob:, data:) and already-absolute URLs (http://, https://,
 * protocol-relative //) are returned as-is — they don't need the API base
 * prepended and MUST NOT have it prepended (it would break them).
 *
 * Server-relative paths (/storage/...) get the API base prepended.
 */
export function appImageSrc(url: string | null | undefined): string {
  if (!url) return '';

  // Already absolute, protocol-relative, or local browser URI — return as-is
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('//') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return url;
  }

  // Server-relative path — resolve against API base
  return resolveImageUrl(url, API_BASE) ?? '';
}