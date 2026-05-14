import api from './axiosInstance';
import type { AuthResponse, RegisterData, LoginData, RegisterResponse, TokenPair } from '../types';

export const authApi = {
  register: (data: RegisterData) =>
    api.post<RegisterResponse>('/auth/register', data).then((r) => r.data),

  login: (data: LoginData) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    api.post<TokenPair>('/auth/refresh', { refreshToken }).then((r) => r.data),

  logout: () =>
    api.post<{ message: string }>('/auth/logout').then((r) => r.data),
};
