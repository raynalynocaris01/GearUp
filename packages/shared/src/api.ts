
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


// ──────────────────────────────────────────────────────────
// CAMPSITES
// ──────────────────────────────────────────────────────────

export interface Campsite {
  id: number;
  name: string;
  description: string;
  location: string;
  region: string;
  price_per_night: string;
  price_unit: string;
  image_url: string;
  rating: string;
  reviews_count: number;
  capacity: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export const campsiteApi = (client: ApiClient) => ({
  list: (params?: { featured?: boolean }) =>
    client.get<Campsite[]>('/campsites', { params }),

  get: (id: number | string) =>
    client.get<Campsite>(`/campsites/${id}`),
});

// ──────────────────────────────────────────────────────────
// BOOKINGS
// ──────────────────────────────────────────────────────────

export interface Booking {
  id: number;
  user_id: number;
  campsite_id: number;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
  campsite?: Campsite;
}

export interface CreateBookingPayload {
  campsite_id: number;
  check_in: string;   // YYYY-MM-DD
  check_out: string;  // YYYY-MM-DD
  guests: number;
  notes?: string;
}

export const bookingApi = (client: ApiClient) => ({
  list: () => client.get<Booking[]>('/bookings'),

  get: (id: number | string) => client.get<Booking>(`/bookings/${id}`),

  create: (payload: CreateBookingPayload) =>
    client.post<Booking>('/bookings', payload),

  cancel: (id: number | string) =>
    client.post<Booking>(`/bookings/${id}/cancel`),
});