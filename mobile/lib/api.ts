import * as SecureStore from 'expo-secure-store';
import { createApiClient, authApi, campsiteApi, bookingApi, } from '@gearup/shared';

const TOKEN_KEY = 'auth_token';

const getToken = () => SecureStore.getItemAsync(TOKEN_KEY);

export const api = createApiClient(
  process.env.EXPO_PUBLIC_API_URL!,
  getToken,
);

export const auth = authApi(api);
export const campsites = campsiteApi(api);
export const bookings = bookingApi(api);

export const saveToken = (token: string) =>
  SecureStore.setItemAsync(TOKEN_KEY, token);

export const clearToken = () => SecureStore.deleteItemAsync(TOKEN_KEY);

export const hasToken = async () => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  return !!token;
};