import api from './axiosInstance';
import type { StudentPortfolioItem, CreatePortfolioItemData } from '../types';

export const portfolioApi = {
  create: (data: CreatePortfolioItemData) =>
    api.post<StudentPortfolioItem>('/portfolio', data).then((r) => r.data),

  getMy: () =>
    api.get<StudentPortfolioItem[]>('/portfolio/my').then((r) => r.data),

  update: (id: string, data: Partial<CreatePortfolioItemData>) =>
    api.patch<StudentPortfolioItem>(`/portfolio/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/portfolio/${id}`).then((r) => r.data),

  uploadFile: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post<StudentPortfolioItem>(`/portfolio/${id}/file`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
};
