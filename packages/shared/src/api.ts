
import axios from 'axios';

export type TokenProvider = () => Promise<string | null>;

export const createApiClient = (baseURL: string, getToken: TokenProvider) => {
  const client = axios.create({ baseURL });

  client.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return client;
};

export type ApiClient = ReturnType<typeof createApiClient>;

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export const authApi = (client: ApiClient) => ({
  login: (email: string, password: string, deviceName: string) =>
    client.post<AuthResponse>('/login', {
      email,
      password,
      device_name: deviceName,
    }),

  register: (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string,
    deviceName: string,
  ) =>
    client.post<AuthResponse>('/register', {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
      device_name: deviceName,
    }),

  user: () => client.get<AuthUser>('/user'),

  logout: () => client.post<{ message: string }>('/logout'),
});
