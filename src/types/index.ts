// === Enum-like constants (mirror Prisma enums) ===

export const Role = {
  GUEST: 'GUEST',
  STUDENT: 'STUDENT',
  GRADUATE: 'GRADUATE',
  SUPERVISOR: 'SUPERVISOR',
  ADMIN: 'ADMIN',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const WorkStatus = {
  DRAFT: 'DRAFT',
  TOPIC_SELECTED: 'TOPIC_SELECTED',
  APPROVED: 'APPROVED',
  IN_PROGRESS: 'IN_PROGRESS',
  REVIEW: 'REVIEW',
  DEFENSE: 'DEFENSE',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type WorkStatus = (typeof WorkStatus)[keyof typeof WorkStatus];

export const FileType = {
  PDF: 'PDF',
  PRESENTATION: 'PRESENTATION',
  VIDEO: 'VIDEO',
  OTHER: 'OTHER',
} as const;
export type FileType = (typeof FileType)[keyof typeof FileType];

export const TopicRequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type TopicRequestStatus =
  (typeof TopicRequestStatus)[keyof typeof TopicRequestStatus];

// === User ===

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  group: string | null;
  specialization: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isApproved: boolean;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

// === Auth ===

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: Role;
  };
  tokens: TokenPair;
}

export interface PendingRegistrationResponse {
  requiresApproval: true;
  message: string;
}

export type RegisterResponse = AuthResponse | PendingRegistrationResponse;

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  group?: string;
  specialization?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// === Work ===

export interface WorkFile {
  id: string;
  type: string;
  originalName: string;
  url: string;
}

export interface WorkAuthor {
  id: string;
  fullName: string;
  email: string;
}

export interface Work {
  id: string;
  title: string;
  description?: string | null;
  annotation: string | null;
  category: string | null;
  tags: string[];
  status: WorkStatus;
  year: number | null;
  qualityScore: number | null;
  viewCount: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  supervisorId: string | null;
  author: WorkAuthor;
  supervisor: WorkAuthor | null;
  files: WorkFile[];
  _count: { reviews: number; comments: number };
}

export interface CreateWorkData {
  title: string;
  description?: string;
  annotation?: string;
  category?: string;
  tags?: string[];
  year?: number;
  supervisorId?: string;
}

export interface UpdateWorkData {
  title?: string;
  description?: string;
  annotation?: string;
  category?: string;
  tags?: string[];
  year?: number;
  isPublic?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const SortBy = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  SCORE_DESC: 'scoreDesc',
  SCORE_ASC: 'scoreAsc',
} as const;
export type SortBy = (typeof SortBy)[keyof typeof SortBy];

export const StatusFilter = {
  PUBLISHED: 'published',
  IN_PROGRESS: 'in_progress',
  ALL: 'all',
} as const;
export type StatusFilter = (typeof StatusFilter)[keyof typeof StatusFilter];

export interface WorkQueryParams {
  category?: string;
  year?: number;
  supervisorId?: string;
  status?: WorkStatus;
  sortBy?: SortBy;
  statusFilter?: StatusFilter;
  minScore?: number;
  maxScore?: number;
  page?: number;
  limit?: number;
}

// === Search ===

export interface SearchResult {
  id: string;
  title: string;
  description?: string | null;
  annotation: string | null;
  category: string | null;
  tags: string[];
  year: number | null;
  qualityScore: number | null;
  authorName: string;
  supervisorName: string | null;
  rank: number;
  headline: string | null;
}

export interface SearchParams {
  q: string;
  year?: number;
  supervisorId?: string;
  category?: string;
  minScore?: number;
  page?: number;
  limit?: number;
}

export interface SearchResponse {
  data: SearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  convertedQuery?: string;
}

export interface SuggestResult {
  id: string;
  title: string;
  similarity: number;
}

// === Review ===

export interface Review {
  id: string;
  criteria: Record<string, number>;
  weights: Record<string, number>;
  totalScore: number;
  comment: string | null;
  isFinalized: boolean;
  createdAt: string;
  updatedAt: string;
  reviewerId: string;
  workId: string;
  reviewer?: { id: string; fullName: string };
}

export interface CreateReviewData {
  criteria: Record<string, number>;
  weights: Record<string, number>;
  comment?: string;
}

// === Comment ===

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  authorId: string;
  workId: string;
  author?: { id: string; fullName: string; avatarUrl: string | null };
}

// === Work Stage ===

export interface WorkStage {
  id: string;
  name: string;
  deadline: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
  workId: string;
}

// === Topic Request ===

export interface TopicRequest {
  id: string;
  proposedTopic: string;
  justification: string | null;
  rejectReason: string | null;
  status: TopicRequestStatus;
  supervisorId: string;
  studentId: string;
  createdAt: string;
  updatedAt: string;
  student?: { id: string; fullName: string; email: string; group: string | null };
  supervisor?: { id: string; fullName: string; email: string; specialization: string | null };
}

export interface CreateTopicRequestData {
  proposedTopic: string;
  justification?: string;
  supervisorId: string;
}

// === Portfolio ===

export const PortfolioItemType = {
  COURSEWORK: 'COURSEWORK',
  PERSONAL_PROJECT: 'PERSONAL_PROJECT',
  RESEARCH_PAPER: 'RESEARCH_PAPER',
  OTHER: 'OTHER',
} as const;
export type PortfolioItemType =
  (typeof PortfolioItemType)[keyof typeof PortfolioItemType];

export const PORTFOLIO_TYPE_LABELS: Record<PortfolioItemType, string> = {
  [PortfolioItemType.COURSEWORK]: 'Курсовая работа',
  [PortfolioItemType.PERSONAL_PROJECT]: 'Личный проект',
  [PortfolioItemType.RESEARCH_PAPER]: 'Научная статья',
  [PortfolioItemType.OTHER]: 'Другое',
};

export interface StudentPortfolioItem {
  id: string;
  title: string;
  type: PortfolioItemType;
  description: string | null;
  year: number | null;
  grade: string | null;
  fileUrl: string | null;
  createdAt: string;
  studentId: string;
}

export interface CreatePortfolioItemData {
  title: string;
  type: PortfolioItemType;
  description?: string;
  year?: number;
  grade?: string;
}

// === Work Message ===

export interface WorkMessage {
  id: string;
  text: string;
  createdAt: string;
  authorId: string;
  workId: string;
  author: { id: string; fullName: string; avatarUrl: string | null };
}

// === Supervisor Topic ===

export const TopicResponseStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
} as const;
export type TopicResponseStatus =
  (typeof TopicResponseStatus)[keyof typeof TopicResponseStatus];

export interface SupervisorTopic {
  id: string;
  title: string;
  description: string | null;
  area: string | null;
  isActive: boolean;
  createdAt: string;
  supervisorId: string;
  supervisor?: { id: string; fullName: string; specialization: string | null; avatarUrl: string | null };
  responses?: TopicResponse[];
  _count?: { responses: number };
}

export interface TopicResponse {
  id: string;
  message: string | null;
  status: TopicResponseStatus;
  createdAt: string;
  studentId: string;
  topicId: string;
  student?: {
    id: string;
    fullName: string;
    email: string;
    group: string | null;
    avatarUrl: string | null;
    portfolioItems?: { id: string; title: string; type: PortfolioItemType; year: number | null; grade: string | null }[];
  };
  topic?: SupervisorTopic;
}

export interface ReviewCriteriaConfig {
  id: string;
  name: string;
  description: string | null;
  weight: number;
  maxScore: number;
  isActive: boolean;
  orderIndex: number;
}

// === Notification ===

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data: Record<string, string> | null;
  createdAt: string;
  userId: string;
}

// === Analytics ===

export interface TrendItem {
  year: number;
  category: string;
  count: number;
}

export interface SupervisorStats {
  supervisorId: string;
  supervisorName: string;
  totalWorks: number;
  avgScore: number;
}

export interface ScoreDistribution {
  range: string;
  count: number;
}

export interface DashboardData {
  totalWorks: number;
  totalUsers: number;
  totalSupervisors: number;
  avgQualityScore: number;
  recentWorks: number;
}
