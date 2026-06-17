import { useState, useEffect, type ReactNode, type FormEvent } from 'react';
import { useConfirmDialog } from '../../components/ConfirmDialog';
import { useAuth } from '../../hooks';
import { infoApi, type InfoPost, type CreateInfoPostData } from '../../api';
import { Role } from '../../types';
import { formatDate } from '../../utils/constants';
import styles from './Info.module.css';

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

interface PostFormProps {
  initial?: InfoPost;
  onSave: (post: InfoPost) => void;
  onCancel: () => void;
}

function PostForm({ initial, onSave, onCancel }: PostFormProps): ReactNode {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [isPinned, setIsPinned] = useState(initial?.isPinned ?? false);
  const [tags, setTags] = useState(initial?.tags.join(', ') ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setIsSaving(true);
    setError('');
    try {
      const data: CreateInfoPostData = {
        title: title.trim(),
        content: content.trim(),
        isPinned,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };
      const saved = initial
        ? await infoApi.update(initial.id, data)
        : await infoApi.create(data);
      onSave(saved);
    } catch {
      setError('Не удалось сохранить. Попробуйте ещё раз.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className={styles.postForm} onSubmit={(e) => void handleSubmit(e)}>
      <div className={styles.postFormTitle}>{initial ? 'Редактировать запись' : 'Новая запись'}</div>
      {error && <div className={styles.formError}>{error}</div>}
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="info-title">Заголовок *</label>
        <input
          id="info-title"
          type="text"
          className={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="info-content">Содержание *</label>
        <textarea
          id="info-content"
          className={styles.textarea}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="info-tags">Теги (через запятую)</label>
        <input
          id="info-tags"
          type="text"
          className={styles.input}
          placeholder="сроки, требования, чеклист"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </div>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={isPinned}
          onChange={(e) => setIsPinned(e.target.checked)}
          style={{ accentColor: 'var(--accent)' }}
        />
        Закрепить запись (показывать первой)
      </label>
      <div className={styles.formActions}>
        <button type="submit" className={styles.btnPrimary} disabled={isSaving}>
          {isSaving ? 'Сохранение...' : initial ? 'Сохранить' : 'Опубликовать'}
        </button>
        <button type="button" className={styles.btnGhost} onClick={onCancel}>Отмена</button>
      </div>
    </form>
  );
}

interface PostCardProps {
  post: InfoPost;
  canEdit: boolean;
  onEdit: (post: InfoPost) => void;
  onDelete: (id: string) => void;
  expanded: boolean;
  onToggle: () => void;
}

function PostCard({ post, canEdit, onEdit, onDelete, expanded, onToggle }: PostCardProps): ReactNode {
  const [deleting, setDeleting] = useState(false);
  const { requestConfirmation } = useConfirmDialog();

  const handleDelete = async (): Promise<void> => {
    const confirmed = await requestConfirmation({
      title: 'Удалить запись?',
      message: 'Запись будет удалена из информационного центра. Это действие нельзя отменить.',
      confirmLabel: 'Удалить',
      variant: 'danger',
    });
    if (!confirmed) return;
    setDeleting(true);
    try {
      await infoApi.delete(post.id);
      onDelete(post.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <article className={`${styles.postCard} ${post.isPinned ? styles.postCardPinned : ''}`}>
      {post.isPinned && <div className={styles.pinnedBadge}>📌 Закреплено</div>}
      <div className={styles.postHeader} onClick={onToggle} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onToggle(); }}>
        <div className={styles.postHeaderLeft}>
          <h2 className={styles.postTitle}>{post.title}</h2>
          <div className={styles.postMeta}>
            <div className={styles.postAuthor}>
              <div className={styles.authorAvatar}>{getInitials(post.author.fullName)}</div>
              <span>{post.author.fullName}</span>
            </div>
            <span className={styles.postDate}>{formatDate(post.createdAt)}</span>
          </div>
        </div>
        <div className={styles.postChevron} style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className={styles.postContent}>
          <div className={styles.postBody}>{post.content}</div>
          {post.tags.length > 0 && (
            <div className={styles.postTags}>
              {post.tags.map((tag) => (
                <span key={tag} className={styles.postTag}>{tag}</span>
              ))}
            </div>
          )}
          {canEdit && (
            <div className={styles.postActions}>
              <button type="button" className={styles.btnEdit} onClick={() => onEdit(post)}>Редактировать</button>
              <button type="button" className={styles.btnDelete} onClick={() => void handleDelete()} disabled={deleting}>
                {deleting ? '...' : 'Удалить'}
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export function InfoPage(): ReactNode {
  const { user, isAuthenticated, hasRole } = useAuth();
  const [posts, setPosts] = useState<InfoPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<InfoPost | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const canCreate = isAuthenticated && hasRole(Role.SUPERVISOR, Role.ADMIN);

  const load = async (q?: string): Promise<void> => {
    setIsLoading(true);
    try {
      const data = await infoApi.getAll(q);
      setPosts(data);
      if (!expandedId && data.length > 0) {
        setExpandedId(data[0].id);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSearch = (e: FormEvent): void => {
    e.preventDefault();
    void load(query.trim() || undefined);
  };

  const handleSave = (post: InfoPost): void => {
    setPosts((prev) => {
      const idx = prev.findIndex((p) => p.id === post.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = post;
        return next.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
      }
      return [post, ...prev];
    });
    setShowForm(false);
    setEditingPost(null);
    setExpandedId(post.id);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Информационный центр</h1>
          <p className={styles.subtitle}>
            Всё, что нужно знать студенту для подготовки дипломной работы
          </p>
        </div>
        {canCreate && !showForm && !editingPost && (
          <button type="button" className={styles.btnPrimary} onClick={() => setShowForm(true)}>
            + Новая запись
          </button>
        )}
      </div>

      <form className={styles.searchBar} onSubmit={handleSearch}>
        <span className={styles.searchIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Поиск по записям, тегам..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!e.target.value.trim()) void load();
          }}
        />
        <button type="submit" className={styles.searchBtn}>Найти</button>
      </form>

      {(showForm || editingPost) && (
        <PostForm
          initial={editingPost ?? undefined}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingPost(null); }}
        />
      )}

      {isLoading ? (
        <div className={styles.empty}>Загрузка...</div>
      ) : posts.length === 0 ? (
        <div className={styles.empty}>
          {query ? 'По вашему запросу ничего не найдено' : 'Записей пока нет'}
        </div>
      ) : (
        <div className={styles.posts}>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              canEdit={canCreate && (hasRole(Role.ADMIN) || post.author.id === user?.id)}
              onEdit={(p) => { setEditingPost(p); setShowForm(false); }}
              onDelete={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
              expanded={expandedId === post.id}
              onToggle={() => setExpandedId(expandedId === post.id ? null : post.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
