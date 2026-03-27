import api from './axiosInstance';
import type { WorkFile } from '../types';

export const filesApi = {
  upload: (workId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post<WorkFile>(`/files/works/${workId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  delete: (fileId: string) =>
    api.delete(`/files/${fileId}`).then((r) => r.data),
};
