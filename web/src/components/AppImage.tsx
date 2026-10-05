import { resolveImageUrl } from '@gearup/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

/**
 * Turn a stored image_url (absolute or relative) into an absolute URL
 * suitable for <Image src={...}>.
 */
export function appImageSrc(url: string | null | undefined): string {
  return resolveImageUrl(url, API_BASE) ?? '';
}