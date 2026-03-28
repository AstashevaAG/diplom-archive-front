import api from './axiosInstance';

export interface InfoPost {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author: { id: string; fullName: string };
}

export interface CreateInfoPostData {
  title: string;
  content: string;
  isPinned?: boolean;
  tags?: string[];
}

export const infoApi = {
  getAll: (q?: string) =>
    api.get<InfoPost[]>('/info', { params: q ? { q } : {} }).then((r) => r.data),

  getById: (id: string) =>
    api.get<InfoPost>(`/info/${id}`).then((r) => r.data),

  create: (data: CreateInfoPostData) =>
    api.post<InfoPost>('/info', data).then((r) => r.data),

  update: (id: string, data: Partial<CreateInfoPostData>) =>
    api.patch<InfoPost>(`/info/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/info/${id}`).then((r) => r.data),
};
