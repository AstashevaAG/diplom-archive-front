import api from './axiosInstance';
import type {
  SearchResult,
  SearchParams,
  SuggestResult,
  PaginatedResponse,
} from '../types';

export const searchApi = {
  search: (params: SearchParams) =>
    api
      .get<PaginatedResponse<SearchResult>>('/search', { params })
      .then((r) => r.data),

  suggest: (q: string) =>
    api
      .get<SuggestResult[]>('/search/suggest', { params: { q } })
      .then((r) => r.data),
};
