
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
  role: 'admin' | 'owner' | 'customer';
  is_approved: boolean;
  is_suspended?: boolean;
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
      role: 'customer' | 'owner' = 'customer',
    ) =>
      client.post<AuthResponse>('/register', {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        device_name: deviceName,
        role,
      }),

  user: () => client.get<AuthUser>('/user'),

  logout: () => client.post<{ message: string }>('/logout'),
});


// ──────────────────────────────────────────────────────────
// CAMPSITES
// ──────────────────────────────────────────────────────────

export interface Campsite {
  id: number;
  owner_id?: number | null;
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
  tour_guides?: TourGuide[];
  reviews?: Review[];
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
  campsite_id: number | null;
  tour_guide_id: number | null;
  check_in: string | null;
  check_out: string | null;
  guests: number;
  total_price: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
  campsite?: Campsite | null;
  tour_guide?: TourGuide | null;
  review?: Review | null;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface CreateBookingPayload {
  campsite_id?: number | null;
  tour_guide_id?: number | null;
  check_in?: string | null;
  check_out?: string | null;
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

// ──────────────────────────────────────────────────────────
// OWNER
// ──────────────────────────────────────────────────────────

export interface OwnerDashboardStats {
  total_campsites: number;
  total_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  total_revenue: number;
}

export interface TourGuide {
  id: number;
  campsite_id: number | null;
  name: string;
  contact_number: string;
  email: string | null;
  description: string | null;
  price_per_trip: string;
  is_independent: boolean;
  location: string | null;
  created_at: string;
  updated_at: string;
  campsite?: {
    id: number;
    name: string;
    location: string;
    image_url: string;
    owner_id: number | null;
  } | null;
}

export interface CreateCampsitePayload {
  name: string;
  description: string;
  location: string;
  region: string;
  price_per_night: number;
  price_unit: 'night' | 'entrance';
  image_url: string;
  capacity: number;
}

export interface CreateTourGuidePayload {
  name: string;
  contact_number: string;
  email?: string;
  description?: string;
  price_per_trip: number;
  location?: string;
}
export const ownerApi = (client: ApiClient) => ({
  dashboard: () => client.get<OwnerDashboardStats>('/owner/dashboard'),

  // Campsites
  listCampsites: () => client.get<Campsite[]>('/owner/campsites'),

  getCampsite: (id: number | string) =>
    client.get<Campsite>(`/owner/campsites/${id}`),

  createCampsite: (payload: CreateCampsitePayload) =>
    client.post<Campsite>('/owner/campsites', payload),

  updateCampsite: (id: number | string, payload: Partial<CreateCampsitePayload>) =>
    client.put<Campsite>(`/owner/campsites/${id}`, payload),

  deleteCampsite: (id: number | string) =>
    client.delete(`/owner/campsites/${id}`),

  uploadCampsiteImage: (id: number | string, formData: FormData) =>
    client.post<{ message: string; image_url: string; campsite: Campsite }>(
      `/owner/campsites/${id}/image`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    ),

  // Tour guides
  listTourGuides: (campsiteId: number | string) =>
    client.get<TourGuide[]>(`/owner/campsites/${campsiteId}/tour-guides`),

  createTourGuide: (campsiteId: number | string, payload: CreateTourGuidePayload) =>
    client.post<TourGuide>(`/owner/campsites/${campsiteId}/tour-guides`, payload),

  deleteTourGuide: (guideId: number | string) =>
    client.delete(`/owner/tour-guides/${guideId}`),
  
  // All guides owned by the current owner (attached + independent)
  listAllMyGuides: () => client.get<TourGuide[]>('/owner/tour-guides'),

  // Create an independent guide (no campsite)
  createIndependentGuide: (payload: CreateTourGuidePayload) =>
    client.post<TourGuide>('/owner/tour-guides', {
      ...payload,
      is_independent: true,
    }),

  // Bookings
  listBookings: () => client.get<Booking[]>('/owner/bookings'),

  confirmBooking: (id: number | string) =>
    client.post<Booking>(`/owner/bookings/${id}/confirm`),

  cancelBooking: (id: number | string) =>
    client.post<Booking>(`/owner/bookings/${id}/cancel`),

  completeBooking: (id: number | string) =>
    client.post<Booking>(`/owner/bookings/${id}/complete`),
});

// ──────────────────────────────────────────────────────────
// ADMIN
// ──────────────────────────────────────────────────────────

export interface AdminDashboardStats {
  total_users: number;
  total_owners: number;
  pending_owners: number;
  suspended_users: number;
  total_campsites: number;
  featured_campsites: number;
  total_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  total_revenue: number;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'owner' | 'customer';
  is_approved: boolean;
  is_suspended: boolean;
  created_at: string;
  updated_at: string;
}

export const adminApi = (client: ApiClient) => ({
  dashboard: () => client.get<AdminDashboardStats>('/admin/dashboard'),

  // Users
  listUsers: (params?: { role?: string; status?: string }) =>
    client.get<AdminUser[]>('/admin/users', { params }),

  getUser: (id: number | string) =>
    client.get<AdminUser>(`/admin/users/${id}`),

  approveUser: (id: number | string) =>
    client.post<AdminUser>(`/admin/users/${id}/approve`),

  rejectUser: (id: number | string) =>
    client.post<AdminUser>(`/admin/users/${id}/reject`),

  suspendUser: (id: number | string) =>
    client.post<AdminUser>(`/admin/users/${id}/suspend`),

  reinstateUser: (id: number | string) =>
    client.post<AdminUser>(`/admin/users/${id}/reinstate`),

  // Campsites
  listCampsites: () => client.get<Campsite[]>('/admin/campsites'),

  toggleFeatured: (id: number | string) =>
    client.post<Campsite>(`/admin/campsites/${id}/feature`),

  deleteCampsite: (id: number | string) =>
    client.delete(`/admin/campsites/${id}`),

  // Bookings
  listBookings: (params?: { status?: string }) =>
    client.get<Booking[]>('/admin/bookings', { params }),
});

// ──────────────────────────────────────────────────────────
// REVIEWS
// ──────────────────────────────────────────────────────────

export interface Review {
  id: number;
  user_id: number;
  campsite_id: number;
  booking_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
  };
}

export interface CreateReviewPayload {
  booking_id: number;
  rating: number;
  comment?: string;
}

export const reviewApi = (client: ApiClient) => ({
  listForCampsite: (campsiteId: number | string) =>
    client.get<Review[]>(`/campsites/${campsiteId}/reviews`),

  create: (campsiteId: number | string, payload: CreateReviewPayload) =>
    client.post<Review>(`/campsites/${campsiteId}/reviews`, payload),

  delete: (reviewId: number | string) =>
    client.delete(`/reviews/${reviewId}`),
});

// ──────────────────────────────────────────────────────────
// TOUR GUIDES (PUBLIC)
// ──────────────────────────────────────────────────────────

export const tourGuideApi = (client: ApiClient) => ({
  list: (params?: { independent?: boolean; campsite_id?: number }) =>
    client.get<TourGuide[]>('/tour-guides', { params }),

  get: (id: number | string) =>
    client.get<TourGuide>(`/tour-guides/${id}`),
});