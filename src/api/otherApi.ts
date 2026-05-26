import api from './axiosInstance';
import type {
  TopicRequest,
  CreateTopicRequestData,
  Notification,
  TrendItem,
  SupervisorStats,
  ScoreDistribution,
  DashboardData,
  WorkStage,
} from '../types';

export const topicRequestsApi = {
  create: (data: CreateTopicRequestData) =>
    api.post<TopicRequest>('/topic-requests', data).then((r) => r.data),

  getMy: () =>
    api.get<TopicRequest[]>('/topic-requests/my').then((r) => r.data),

  getInbox: () =>
    api.get<TopicRequest[]>('/topic-requests/inbox').then((r) => r.data),

  approve: (id: string) =>
    api.patch<TopicRequest>(`/topic-requests/${id}/approve`).then((r) => r.data),

  reject: (id: string, rejectReason?: string) =>
    api.patch<TopicRequest>(`/topic-requests/${id}/reject`, { rejectReason }).then((r) => r.data),
};

export const notificationsApi = {
  getAll: () =>
    api.get<Notification[]>('/notifications').then((r) => r.data),

  getUnreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data),

  markAsRead: (id: string) =>
    api.patch<Notification>(`/notifications/${id}/read`).then((r) => r.data),

  markAllAsRead: () =>
    api.patch<{ message: string }>('/notifications/read-all').then((r) => r.data),
};

export const stagesApi = {
  getStages: (workId: string) =>
    api.get<WorkStage[]>(`/works/${workId}/stages`).then((r) => r.data),

  getByWork: (workId: string) =>
    api.get<WorkStage[]>(`/works/${workId}/stages`).then((r) => r.data),

  updateStage: (workId: string, stageId: string, isCompleted: boolean) =>
    api.patch<WorkStage>(`/works/${workId}/stages/${stageId}`, { isCompleted }).then((r) => r.data),

  update: (workId: string, stageId: string, data: { isCompleted?: boolean }) =>
    api.patch<WorkStage>(`/works/${workId}/stages/${stageId}`, data).then((r) => r.data),
};

export const analyticsApi = {
  getTrends: () =>
    api.get<TrendItem[]>('/analytics/trends').then((r) => r.data),

  getSupervisorStats: () =>
    api.get<SupervisorStats[]>('/analytics/supervisors').then((r) => r.data),

  getScoreDistribution: () =>
    api.get<ScoreDistribution[]>('/analytics/scores').then((r) => r.data),

  getPopularCategories: () =>
    api.get<{ category: string; count: number }[]>('/analytics/categories').then((r) => r.data),

  getDashboard: () =>
    api.get<DashboardData>('/analytics/dashboard').then((r) => r.data),

  exportDepartmentCsv: () =>
    api
      .get<Blob>('/analytics/reports/department.csv', { responseType: 'blob' })
      .then((r) => r.data),

  exportDepartmentPdf: () =>
    api
      .get<Blob>('/analytics/reports/department.pdf', { responseType: 'blob' })
      .then((r) => r.data),
};
