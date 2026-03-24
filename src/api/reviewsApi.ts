import api from './axiosInstance';
import type { Review, CreateReviewData, Comment as WorkComment } from '../types';

export const reviewsApi = {
  create: (workId: string, data: CreateReviewData) =>
    api.post<Review>(`/works/${workId}/reviews`, data).then((r) => r.data),

  getByWork: (workId: string) =>
    api.get<Review[]>(`/works/${workId}/reviews`).then((r) => r.data),

  update: (reviewId: string, data: Partial<CreateReviewData>) =>
    api.patch<Review>(`/reviews/${reviewId}`, data).then((r) => r.data),

  finalize: (reviewId: string) =>
    api.post<Review>(`/reviews/${reviewId}/finalize`).then((r) => r.data),
};

export const commentsApi = {
  getByWork: (workId: string) =>
    api.get<WorkComment[]>(`/works/${workId}/comments`).then((r) => r.data),

  create: (workId: string, text: string) =>
    api.post<WorkComment>(`/works/${workId}/comments`, { text }).then((r) => r.data),

  delete: (commentId: string) =>
    api.delete(`/comments/${commentId}`).then((r) => r.data),
};
