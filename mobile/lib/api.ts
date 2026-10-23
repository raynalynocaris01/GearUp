import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import {
  createApiClient,
  authApi,
  campsiteApi,
  bookingApi,
  ownerApi,
  adminApi,
  guideApi,
  reviewApi,
  tourGuideApi,
  gearApi,
  myGearApi,
  notificationApi,
  eventApi,
} from '@gearup/shared';

const TOKEN_KEY = 'auth_token';

const getToken = () => SecureStore.getItemAsync(TOKEN_KEY);

const clearToken = () => SecureStore.deleteItemAsync(TOKEN_KEY);

const handleUnauthorized = async (url: string) => {
  await clearToken();

  // Only redirect to login if a PROTECTED endpoint returned 401.
  // Public endpoints just clear the stale token — user continues as guest.
  const protectedPrefixes = [
    '/user',
    '/bookings',
    '/owner/',
    '/guide/',
    '/admin/',
    '/my/',
  ];

  const isProtected = protectedPrefixes.some((p) => url.includes(p));

  if (isProtected) {
    router.replace('/login');
  }
};

export const api = createApiClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL!,
  getToken,
  onUnauthorized: handleUnauthorized,
});

export const auth = authApi(api);
export const campsites = campsiteApi(api);
export const bookings = bookingApi(api);
export const owner = ownerApi(api);
export const admin = adminApi(api);
export const guide = guideApi(api);
export const reviews = reviewApi(api);
export const tourGuides = tourGuideApi(api);
export const gear = gearApi(api);
export const myGear = myGearApi(api);
export const notifications = notificationApi(api);
export const events = eventApi(api);

export const saveToken = (token: string) =>
  SecureStore.setItemAsync(TOKEN_KEY, token);

export { clearToken };

export const hasToken = async () => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  return !!token;
};
