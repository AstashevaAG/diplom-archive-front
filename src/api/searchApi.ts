import api from './axiosInstance';
import type {
  SearchParams,
  SuggestResult,
  SearchResponse,
} from '../types';

export const searchApi = {
  search: (params: SearchParams) =>
    api
      .get<SearchResponse>('/search', { params })
      .then((r) => r.data),

  suggest: (q: string) =>
    api
      .get<SuggestResult[]>('/search/suggest', { params: { q } })
      .then((r) => r.data),
};
