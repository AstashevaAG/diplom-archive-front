import api from './axiosInstance';
import type { FileVersionCompareResult, WorkFile } from '../types';

export const filesApi = {
  upload: (workId: string, file: File, comment?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (comment?.trim()) {
      formData.append('comment', comment.trim());
    }
    return api
      .post<WorkFile>(`/files/works/${workId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  delete: (fileId: string) =>
    api.delete(`/files/${fileId}`).then((r) => r.data),

  /** Для предпросмотра в модалке (с заголовком Authorization, если есть токен) */
  getBlob: (fileId: string) =>
    api.get<Blob>(`/files/${fileId}`, { responseType: 'blob' }).then((r) => r.data),

  getVersions: (workId: string) =>
    api.get<WorkFile[]>(`/files/works/${workId}/versions`).then((r) => r.data),

  compareVersions: (workId: string, fromFileId: string, toFileId: string) =>
    api
      .get<FileVersionCompareResult>(`/files/works/${workId}/compare`, {
        params: { from: fromFileId, to: toFileId },
      })
      .then((r) => r.data),
};
