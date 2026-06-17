import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useConfirmDialog } from '../../components/ConfirmDialog';
import { faqApi, type CreateFaqItemData, type FaqItem } from '../../api';
import { useAuth } from '../../hooks';
import { Role } from '../../types';
import styles from './FAQ.module.css';

interface FaqFormProps {
  initial?: FaqItem;
  nextOrder: number;
  onCancel: () => void;
  onSave: (item: FaqItem) => void;
}

function FaqForm({ initial, nextOrder, onCancel, onSave }: FaqFormProps): ReactNode {
  const [question, setQuestion] = useState(initial?.question ?? '');
  const [answer, setAnswer] = useState(initial?.answer ?? '');
  const [orderIndex, setOrderIndex] = useState(initial?.orderIndex ?? nextOrder);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;
    setIsSaving(true);
    setError('');

    try {
      const payload: CreateFaqItemData = {
        question: question.trim(),
        answer: answer.trim(),
        orderIndex,
        isActive,
      };
      const saved = initial
        ? await faqApi.update(initial.id, payload)
        : await faqApi.create(payload);
      onSave(saved);
    } catch {
      setError('Не удалось сохранить вопрос. Попробуйте ещё раз.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={(e) => void handleSubmit(e)}>
      <div className={styles.formTitle}>
        {initial ? 'Редактировать вопрос' : 'Новый вопрос'}
      </div>
      {error && <div className={styles.formError}>{error}</div>}

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="faq-question">Вопрос *</label>
        <input
          id="faq-question"
          type="text"
          className={styles.input}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="faq-answer">Ответ *</label>
        <textarea
          id="faq-answer"
          className={styles.textarea}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={7}
          required
        />
      </div>

      <div className={styles.formGrid}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="faq-order">Порядок</label>
          <input
            id="faq-order"
            type="number"
            min={0}
            className={styles.input}
            value={String(orderIndex)}
            onChange={(e) => setOrderIndex(Number(e.target.value))}
          />
        </div>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Показывать на странице «Информация»
        </label>
      </div>

      <div className={styles.formActions}>
        <button type="submit" className={styles.btnPrimary} disabled={isSaving}>
          {isSaving ? 'Сохранение...' : 'Сохранить'}
        </button>
        <button type="button" className={styles.btnGhost} onClick={onCancel}>
          Отмена
        </button>
      </div>
    </form>
  );
}

interface FaqAccordionItemProps {
  item: FaqItem;
  isOpen: boolean;
  canManage: boolean;
  onToggle: () => void;
  onEdit: (item: FaqItem) => void;
  onDelete: (id: string) => void;
}

function FaqAccordionItem({
  item,
  isOpen,
  canManage,
  onToggle,
  onEdit,
  onDelete,
}: FaqAccordionItemProps): ReactNode {
  const [isDeleting, setIsDeleting] = useState(false);
  const { requestConfirmation } = useConfirmDialog();

  const handleDelete = async (): Promise<void> => {
    const confirmed = await requestConfirmation({
      title: 'Удалить вопрос?',
      message: 'Вопрос исчезнет со страницы «Информация». Это действие нельзя отменить.',
      confirmLabel: 'Удалить',
      variant: 'danger',
    });
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await faqApi.delete(item.id);
      onDelete(item.id);
    } catch {
      setIsDeleting(false);
    }
  };

  return (
    <article className={`${styles.item} ${!item.isActive ? styles.itemInactive : ''}`}>
      <button
        type="button"
        className={styles.itemHeader}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className={styles.question}>{item.question}</span>
        <span className={styles.chevron} data-open={isOpen}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className={styles.itemBody}>
          <div className={styles.answer}>{item.answer}</div>
          {canManage && (
            <div className={styles.itemActions}>
              <span className={item.isActive ? styles.statusActive : styles.statusHidden}>
                {item.isActive ? 'Опубликован' : 'Скрыт'}
              </span>
              <button type="button" className={styles.btnEdit} onClick={() => onEdit(item)}>
                Редактировать
              </button>
              <button
                type="button"
                className={styles.btnDelete}
                onClick={() => void handleDelete()}
                disabled={isDeleting}
              >
                {isDeleting ? '...' : 'Удалить'}
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export function FAQPage(): ReactNode {
  const { hasRole } = useAuth();
  const [items, setItems] = useState<FaqItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<FaqItem | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const canManage = hasRole(Role.SUPERVISOR, Role.ADMIN);

  const load = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const data = canManage ? await faqApi.getManageList() : await faqApi.getAll();
      setItems(data);
      if (!expandedId && data.length > 0) {
        setExpandedId(data[0].id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [canManage]);

  const sortedItems = [...items].sort(
    (a, b) => a.orderIndex - b.orderIndex || a.createdAt.localeCompare(b.createdAt),
  );
  const nextOrder = sortedItems.length > 0
    ? Math.max(...sortedItems.map((item) => item.orderIndex)) + 1
    : 0;

  const handleSave = (item: FaqItem): void => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((current) => current.id === item.id);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = item;
        return next;
      }
      return [...prev, item];
    });
    setShowForm(false);
    setEditingItem(null);
    setExpandedId(item.id);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Информация</h1>
          <p className={styles.subtitle}>
            Частые вопросы о выборе темы, загрузке файлов и работе с дипломом
          </p>
        </div>
        {canManage && !showForm && !editingItem && (
          <button type="button" className={styles.btnPrimary} onClick={() => setShowForm(true)}>
            + Новый вопрос
          </button>
        )}
      </div>

      {(showForm || editingItem) && (
        <FaqForm
          initial={editingItem ?? undefined}
          nextOrder={nextOrder}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          onSave={handleSave}
        />
      )}

      {isLoading ? (
        <div className={styles.empty}>Загрузка...</div>
      ) : sortedItems.length === 0 ? (
        <div className={styles.empty}>
          {canManage ? 'Добавьте первый вопрос для страницы «Информация»' : 'Информация пока не опубликована'}
        </div>
      ) : (
        <div className={styles.list}>
          {sortedItems.map((item) => (
            <FaqAccordionItem
              key={item.id}
              item={item}
              isOpen={expandedId === item.id}
              canManage={canManage}
              onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
              onEdit={(current) => {
                setEditingItem(current);
                setShowForm(false);
              }}
              onDelete={(id) => {
                setItems((prev) => prev.filter((current) => current.id !== id));
                if (expandedId === id) setExpandedId(null);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
