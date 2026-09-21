import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import {
  createApiClient,
  authApi,
  campsiteApi,
  bookingApi,
  ownerApi,
  adminApi,
  reviewApi,
  tourGuideApi,
} from '@gearup/shared';

const TOKEN_KEY = 'auth_token';

const getToken = () => SecureStore.getItemAsync(TOKEN_KEY);

const clearToken = () => SecureStore.deleteItemAsync(TOKEN_KEY);

const handleUnauthorized = async () => {
  await clearToken();
  router.replace('/login');
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
export const reviews = reviewApi(api);
export const tourGuides = tourGuideApi(api);

export const saveToken = (token: string) =>
  SecureStore.setItemAsync(TOKEN_KEY, token);

export { clearToken };

export const hasToken = async () => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  return !!token;
};