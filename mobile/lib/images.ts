import { resolveImageUrl } from '@gearup/shared';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

/**
 * Turn a stored image_url (absolute or relative) into an absolute URL
 * suitable for <Image source={{ uri: ... }}>. Returns undefined for
 * empty input so it plays nicely with conditional rendering.
 */
export function imgSrc(url: string | null | undefined): string | undefined {
  return resolveImageUrl(url, API_BASE) ?? undefined;
}