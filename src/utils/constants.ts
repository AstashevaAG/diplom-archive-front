export const WORK_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Черновик',
  TOPIC_SELECTED: 'Тема выбрана',
  APPROVED: 'Тема утверждена',
  IN_PROGRESS: 'Работа в процессе написания',
  REVIEW: 'Финальная проверка',
  NEEDS_REVISION: 'Требуются доработки',
  DEFENSE: 'Допущена к защите',
  PUBLISHED: 'Работа завершена',
  ARCHIVED: 'Работа завершена',
};

export const ROLE_LABELS: Record<string, string> = {
  GUEST: 'Гость',
  STUDENT: 'Студент',
  GRADUATE: 'Студент',
  SUPERVISOR: 'Преподаватель',
  ADMIN: 'Администратор',
};

export const REVIEW_CRITERIA_DEFAULTS: Record<string, { label: string; weight: number }> = {
  relevance: { label: 'Актуальность темы', weight: 1.5 },
  novelty: { label: 'Научная новизна', weight: 2 },
  theory: { label: 'Глубина теоретического анализа', weight: 1.5 },
  methodology: { label: 'Корректность методологии', weight: 2 },
  trainingPresentation: { label: 'Тренинговое выступление и контакт с аудиторией', weight: 1.5 },
  structure: { label: 'Логика и структура изложения', weight: 1 },
  formatting: { label: 'Качество оформления', weight: 0.5 },
  independence: { label: 'Самостоятельность работы', weight: 1.5 },
  practicalValue: { label: 'Практическая значимость', weight: 1 },
  defense: { label: 'Качество защиты', weight: 1.5 },
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
