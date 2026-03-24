export const WORK_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Черновик',
  TOPIC_SELECTED: 'Тема выбрана',
  APPROVED: 'Утверждена',
  IN_PROGRESS: 'В работе',
  REVIEW: 'На рецензии',
  DEFENSE: 'Защита',
  PUBLISHED: 'Опубликована',
  ARCHIVED: 'В архиве',
};

export const ROLE_LABELS: Record<string, string> = {
  GUEST: 'Гость',
  STUDENT: 'Студент',
  GRADUATE: 'Выпускник',
  SUPERVISOR: 'Научный руководитель',
  ADMIN: 'Администратор',
};

export const REVIEW_CRITERIA_DEFAULTS: Record<string, { label: string; weight: number }> = {
  novelty: { label: 'Новизна и актуальность', weight: 0.2 },
  methodology: { label: 'Качество методологии', weight: 0.25 },
  practicalValue: { label: 'Практическая ценность', weight: 0.2 },
  formatting: { label: 'Качество оформления', weight: 0.15 },
  defense: { label: 'Защита и презентация', weight: 0.2 },
};

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
