import api from './axiosInstance';
import type {
  Work,
  CreateWorkData,
  UpdateWorkData,
  WorkQueryParams,
  WorkStatus,
  PaginatedResponse,
} from '../types';

export const worksApi = {
  create: (data: CreateWorkData) =>
    api.post<Work>('/works', data).then((r) => r.data),

  getAll: (params?: WorkQueryParams) =>
    api.get<PaginatedResponse<Work>>('/works', { params }).then((r) => r.data),

  getPublic: (page = 1, limit = 20) =>
    api.get<PaginatedResponse<Work>>('/works/public', { params: { page, limit } }).then((r) => r.data),

  getMy: () =>
    api.get<Work[]>('/works/my').then((r) => r.data),

  getSupervised: () =>
    api.get<Work[]>('/works/supervised').then((r) => r.data),

  getById: (id: string) =>
    api.get<Work>(`/works/${id}`).then((r) => r.data),

  update: (id: string, data: UpdateWorkData) =>
    api.patch<Work>(`/works/${id}`, data).then((r) => r.data),

  updateStatus: (id: string, status: WorkStatus) =>
    api.patch<Work>(`/works/${id}/status`, { status }).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/works/${id}`).then((r) => r.data),
};
