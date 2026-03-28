import api from './axiosInstance';
import type { User, Role, StudentPortfolioItem, Work } from '../types';

export const usersApi = {
  getMe: () =>
    api.get<User>('/users/me').then((r) => r.data),

  updateMe: (data: Partial<User>) =>
    api.patch<User>('/users/me', data).then((r) => r.data),

  getSupervisors: () =>
    api.get<User[]>('/users/supervisors').then((r) => r.data),

  getAll: (role?: Role) =>
    api.get<User[]>('/users', { params: role ? { role } : {} }).then((r) => r.data),

  getById: (id: string) =>
    api.get<User>(`/users/${id}`).then((r) => r.data),

  updateRole: (id: string, role: Role) =>
    api.patch<User>(`/users/${id}/role`, { role }).then((r) => r.data),

  blockUser: (id: string, block: boolean) =>
    api.patch<User>(`/users/${id}/block`, { block }).then((r) => r.data),

  getPortfolio: (userId: string) =>
    api.get<StudentPortfolioItem[]>(`/users/${userId}/portfolio`).then((r) => r.data),

  getSupervisorWorks: (userId: string) =>
    api.get<Work[]>(`/users/${userId}/works`).then((r) => r.data),
};
