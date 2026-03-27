import { useState, useEffect, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { worksApi } from '../../api';
import { WORK_STATUS_LABELS } from '../../utils/constants';
import type { Work } from '../../types';
import styles from './WorkDetailPage.module.css';

function FileIcon({ type }: { type: string }): ReactNode {
  if (type === 'PDF') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      </svg>
    );
  }
  if (type === 'PRESENTATION') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h20" />
        <path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" />
        <path d="m7 21 5-5 5 5" />
      </svg>
    );
  }
  if (type === 'VIDEO') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
        <rect x="2" y="6" width="14" height="12" rx="2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function getScoreClass(score: number | null): string {
  if (score === null) return '';
  if (score >= 70) return styles.scoreHigh;
  if (score >= 40) return styles.scoreMedium;
  return styles.scoreLow;
}

export function WorkDetailPage(): ReactNode {
  const { id } = useParams<{ id: string }>();
  const [work, setWork] = useState<Work | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    void (async (): Promise<void> => {
      try {
        const data = await worksApi.getById(id);
        setWork(data);
      } catch {
        setError('Работа не найдена');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  if (isLoading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  if (error || !work) {
    return (
      <div className={styles.page}>
        <Link to="/catalog" className={styles.backLink}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          Назад к каталогу
        </Link>
        <div className={styles.error}>{error || 'Работа не найдена'}</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link to="/catalog" className={styles.backLink}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
        Назад к каталогу
      </Link>

      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{work.title}</h1>
          <span className={styles.statusBadge}>
            {WORK_STATUS_LABELS[work.status] ?? work.status}
          </span>
        </div>

        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {work.author.fullName}
          </span>
          {work.supervisor && (
            <span className={styles.metaItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
              </svg>
              {work.supervisor.fullName}
            </span>
          )}
          {work.year && (
            <span className={styles.metaItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
              {String(work.year)}
            </span>
          )}
          {work.category && (
            <span className={styles.metaItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
              </svg>
              {work.category}
            </span>
          )}
        </div>

        {work.tags.length > 0 && (
          <div className={styles.tags}>
            {work.tags.map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{String(work.viewCount)}</span>
          <span className={styles.statLabel}>Просмотров</span>
        </div>
        <div className={styles.stat}>
          <span className={`${styles.statValue} ${getScoreClass(work.qualityScore)}`}>
            {work.qualityScore !== null ? `${String(work.qualityScore)}%` : '—'}
          </span>
          <span className={styles.statLabel}>Оценка</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{String(work._count?.reviews ?? 0)}</span>
          <span className={styles.statLabel}>Рецензий</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{String(work._count?.comments ?? 0)}</span>
          <span className={styles.statLabel}>Комментариев</span>
        </div>
      </div>

      {/* Annotation */}
      {work.annotation && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Аннотация</h2>
          <p className={styles.annotation}>{work.annotation}</p>
        </div>
      )}

      {/* Files */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Файлы ({String(work.files?.length ?? 0)})
        </h2>
        {work.files && work.files.length > 0 ? (
          <div className={styles.filesList}>
            {work.files.map((file) => (
              <a
                key={file.id}
                href={`/api/files/${file.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.fileItem}
              >
                <span className={styles.fileIcon}>
                  <FileIcon type={file.type} />
                </span>
                <div className={styles.fileInfo}>
                  <div className={styles.fileName}>{file.originalName}</div>
                  <div className={styles.fileType}>{file.type}</div>
                </div>
                <span className={styles.fileAction}>Открыть</span>
              </a>
            ))}
          </div>
        ) : (
          <div className={styles.noFiles}>Файлы ещё не загружены</div>
        )}
      </div>
    </div>
  );
}
