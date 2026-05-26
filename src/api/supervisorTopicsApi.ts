import api from './axiosInstance';
import type { SupervisorTopic, TopicResponse, TopicResponseMessage, ReviewCriteriaConfig } from '../types';

export const supervisorTopicsApi = {
  create: (data: { title: string; description?: string; area?: string }) =>
    api.post<SupervisorTopic>('/supervisor-topics', data).then((r) => r.data),

  getAll: (params?: { supervisorId?: string; area?: string }) =>
    api.get<SupervisorTopic[]>('/supervisor-topics', { params }).then((r) => r.data),

  getMy: () =>
    api.get<SupervisorTopic[]>('/supervisor-topics/my').then((r) => r.data),

  getMyResponses: () =>
    api.get<TopicResponse[]>('/supervisor-topics/my-responses').then((r) => r.data),

  update: (id: string, data: { title?: string; description?: string; area?: string; isActive?: boolean }) =>
    api.patch<SupervisorTopic>(`/supervisor-topics/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/supervisor-topics/${id}`).then((r) => r.data),

  respond: (topicId: string, message?: string) =>
    api.post<TopicResponse>(`/supervisor-topics/${topicId}/respond`, { message }).then((r) => r.data),

  getResponses: (topicId: string) =>
    api.get<TopicResponse[]>(`/supervisor-topics/${topicId}/responses`).then((r) => r.data),

  acceptResponse: (topicId: string, responseId: string) =>
    api.patch<TopicResponse>(`/supervisor-topics/${topicId}/responses/${responseId}/accept`).then((r) => r.data),

  rejectResponse: (topicId: string, responseId: string) =>
    api.patch<TopicResponse>(`/supervisor-topics/${topicId}/responses/${responseId}/reject`).then((r) => r.data),

  getResponseMessages: (topicId: string, responseId: string) =>
    api.get<TopicResponseMessage[]>(`/supervisor-topics/${topicId}/responses/${responseId}/messages`).then((r) => r.data),

  sendResponseMessage: (topicId: string, responseId: string, text: string) =>
    api.post<TopicResponseMessage>(`/supervisor-topics/${topicId}/responses/${responseId}/messages`, { text }).then((r) => r.data),
};

export const reviewCriteriaApi = {
  getAll: () =>
    api.get<ReviewCriteriaConfig[]>('/review-criteria').then((r) => r.data),
};
