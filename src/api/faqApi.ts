import api from './axiosInstance';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author: { id: string; fullName: string };
}

export interface CreateFaqItemData {
  question: string;
  answer: string;
  orderIndex?: number;
  isActive?: boolean;
}

export const faqApi = {
  getAll: () => api.get<FaqItem[]>('/faq').then((r) => r.data),

  getManageList: () => api.get<FaqItem[]>('/faq/manage').then((r) => r.data),

  create: (data: CreateFaqItemData) =>
    api.post<FaqItem>('/faq', data).then((r) => r.data),

  update: (id: string, data: Partial<CreateFaqItemData>) =>
    api.patch<FaqItem>(`/faq/${id}`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/faq/${id}`).then((r) => r.data),
};

