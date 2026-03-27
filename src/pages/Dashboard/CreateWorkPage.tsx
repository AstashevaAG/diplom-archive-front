import { useState, useRef, type ReactNode, type FormEvent, type KeyboardEvent, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { worksApi, filesApi } from '../../api';
import type { CreateWorkData, WorkFile } from '../../types';
import styles from './CreateWorkPage.module.css';

interface PendingFile {
  file: File;
  id: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} Б`;
  if (bytes < 1024 * 1024) return `${String(Math.round(bytes / 1024))} КБ`;
  return `${String((bytes / (1024 * 1024)).toFixed(1))} МБ`;
}

function getFileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return '📄';
  if (['ppt', 'pptx'].includes(ext)) return '📊';
  if (['mp4', 'avi', 'mov', 'webm'].includes(ext)) return '🎬';
  return '📎';
}

export function CreateWorkPage(): ReactNode {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');

  const [title, setTitle] = useState('');
  const [annotation, setAnnotation] = useState('');
  const [category, setCategory] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);

  const handleAddTag = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().replace(/,$/g, '');
      if (tag && !tags.includes(tag)) {
        setTags([...tags, tag]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string): void => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>): void => {
    const selected = e.target.files;
    if (!selected) return;

    const newFiles: PendingFile[] = Array.from(selected).map((file) => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    }));

    setPendingFiles((prev) => [...prev, ...newFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (id: string): void => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const data: CreateWorkData = {
        title: title.trim(),
      };
      if (annotation.trim()) data.annotation = annotation.trim();
      if (category) data.category = category;
      if (tags.length > 0) data.tags = tags;
      if (year) data.year = year;

      const work = await worksApi.create(data);

      if (pendingFiles.length > 0) {
        const uploadedFiles: WorkFile[] = [];
        for (let i = 0; i < pendingFiles.length; i++) {
          setUploadProgress(`Загрузка файла ${String(i + 1)} из ${String(pendingFiles.length)}...`);
          try {
            const uploaded = await filesApi.upload(work.id, pendingFiles[i].file);
            uploadedFiles.push(uploaded);
          } catch {
            console.error(`Failed to upload ${pendingFiles[i].file.name}`);
          }
        }
        setUploadProgress('');
      }

      navigate(`/catalog/${work.id}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Не удалось создать работу';
      setError(message);
      setUploadProgress('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link to="/dashboard" className={styles.backLink}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          Назад к работам
        </Link>
        <h1 className={styles.title}>Новая работа</h1>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <form className={styles.form} onSubmit={(e) => void handleSubmit(e)}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="work-title">
            Название <span className={styles.required}>*</span>
          </label>
          <input
            id="work-title"
            type="text"
            className={styles.input}
            placeholder="Введите название работы"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="work-annotation">
            Аннотация
          </label>
          <textarea
            id="work-annotation"
            className={styles.textarea}
            placeholder="Краткое описание работы..."
            value={annotation}
            onChange={(e) => setAnnotation(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="work-category">
            Категория
          </label>
          <input
            id="work-category"
            type="text"
            className={styles.input}
            placeholder="Например: Клиническая психология"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="work-year">
            Год
          </label>
          <input
            id="work-year"
            type="number"
            className={styles.input}
            min={2000}
            max={2030}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Теги</label>
          <div className={styles.tagsInput}>
            {tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
                <button
                  type="button"
                  className={styles.tagRemove}
                  onClick={() => handleRemoveTag(tag)}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              className={styles.tagInput}
              placeholder={tags.length === 0 ? 'Введите тег и нажмите Enter' : ''}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
            />
          </div>
          <span className={styles.hint}>Нажмите Enter или запятую для добавления тега</span>
        </div>

        {/* File Upload */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Файлы</label>
          <div
            className={styles.dropZone}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add(styles.dropZoneActive);
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove(styles.dropZoneActive);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove(styles.dropZoneActive);
              const droppedFiles = e.dataTransfer.files;
              if (droppedFiles.length > 0) {
                const newFiles: PendingFile[] = Array.from(droppedFiles).map((file) => ({
                  file,
                  id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                }));
                setPendingFiles((prev) => [...prev, ...newFiles]);
              }
            }}
          >
            <div className={styles.dropZoneIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" x2="12" y1="3" y2="15" />
              </svg>
            </div>
            <div className={styles.dropZoneText}>
              Нажмите или перетащите файлы сюда
            </div>
            <div className={styles.dropZoneHint}>
              PDF, презентации, видео • до 50 МБ для PDF • до 500 МБ для видео
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className={styles.fileInput}
            multiple
            accept=".pdf,.ppt,.pptx,.mp4,.avi,.mov,.webm"
            onChange={handleFileSelect}
          />
        </div>

        {pendingFiles.length > 0 && (
          <div className={styles.fileList}>
            {pendingFiles.map((pf) => (
              <div key={pf.id} className={styles.fileItem}>
                <span className={styles.fileIcon}>{getFileIcon(pf.file.name)}</span>
                <div className={styles.fileInfo}>
                  <span className={styles.fileName}>{pf.file.name}</span>
                  <span className={styles.fileSize}>{formatSize(pf.file.size)}</span>
                </div>
                <button
                  type="button"
                  className={styles.fileRemove}
                  onClick={() => handleRemoveFile(pf.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {uploadProgress && (
          <div className={styles.uploadProgress}>{uploadProgress}</div>
        )}

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={isSubmitting || !title.trim()}
          >
            {isSubmitting
              ? uploadProgress || 'Создание...'
              : `Создать работу${pendingFiles.length > 0 ? ` и загрузить ${String(pendingFiles.length)} файл(ов)` : ''}`}
          </button>
          <Link to="/dashboard" className={styles.btnCancel}>
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}
