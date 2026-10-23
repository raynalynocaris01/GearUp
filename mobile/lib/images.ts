import { resolveImageUrl } from '@gearup/shared';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

/**
 * Turn a stored image_url (absolute, relative, or local file URI) into an
 * absolute URL suitable for <Image source={{ uri: ... }}>.
 * Returns undefined for empty input.
 *
 * Local device URIs (file://, content://, data:, blob:) are returned as-is
 * because they don't need (and must not have) the API base prepended.
 */
export function imgSrc(url: string | null | undefined): string | undefined {
  if (!url) return undefined;

  // Local device URIs — return as-is
  if (
    url.startsWith('file://') ||
    url.startsWith('content://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }

  // Server path — resolve against API base
  return resolveImageUrl(url, API_BASE) ?? undefined;
}