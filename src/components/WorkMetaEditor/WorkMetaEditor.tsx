import { useState, useEffect, type FormEvent, type ReactNode } from 'react';
import { worksApi } from '../../api';
import type { Work } from '../../types';
import styles from './WorkMetaEditor.module.css';

interface WorkMetaEditorProps {
  work: Work;
  onSaved: (work: Work) => void;
}

export function WorkMetaEditor({ work, onSaved }: WorkMetaEditorProps): ReactNode {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(work.title);
  const [description, setDescription] = useState(work.description ?? '');
  const [annotation, setAnnotation] = useState(work.annotation ?? '');
  const [category, setCategory] = useState(work.category ?? '');
  const [year, setYear] = useState(work.year != null ? String(work.year) : '');
  const [tagsStr, setTagsStr] = useState(work.tags?.length ? work.tags.join(', ') : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setTitle(work.title);
    setDescription(work.description ?? '');
    setAnnotation(work.annotation ?? '');
    setCategory(work.category ?? '');
    setYear(work.year != null ? String(work.year) : '');
    setTagsStr(work.tags?.length ? work.tags.join(', ') : '');
  }, [work.id, work.title, work.description, work.annotation, work.category, work.year, work.tags]);

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Укажите название');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const tags = tagsStr
        .split(/[,;]/)
        .map((t) => t.trim())
        .filter(Boolean);
      const y = year.trim() ? parseInt(year, 10) : undefined;
      const updated = await worksApi.update(work.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        annotation: annotation.trim() || undefined,
        category: category.trim() || undefined,
        year: y !== undefined && !Number.isNaN(y) ? y : undefined,
        tags: tags.length ? tags : undefined,
      });
      onSaved(updated);
      setOpen(false);
    } catch {
      setError('Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <button type="button" className={styles.toggle} onClick={() => setOpen((v) => !v)}>
        {open ? '▼ Скрыть редактирование' : '▶ Редактировать сведения о работе'}
      </button>
      {open && (
        <form className={styles.form} onSubmit={(e) => void handleSubmit(e)}>
          {error && <div className={styles.error}>{error}</div>}
          <label className={styles.label}>
            Название
            <input
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={500}
            />
          </label>
          <label className={styles.label}>
            Описание (тема, цели)
            <textarea
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Кратко о теме и задачах исследования"
            />
          </label>
          <label className={styles.label}>
            Аннотация
            <textarea
              className={styles.textarea}
              value={annotation}
              onChange={(e) => setAnnotation(e.target.value)}
              rows={5}
              placeholder="Аннотация для каталога и поиска (можно заполнить позже)"
            />
          </label>
          <div className={styles.row}>
            <label className={styles.label}>
              Предметная область / категория
              <input className={styles.input} value={category} onChange={(e) => setCategory(e.target.value)} />
            </label>
            <label className={styles.label}>
              Год
              <input
                className={styles.input}
                type="number"
                min={1990}
                max={2100}
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </label>
          </div>
          <label className={styles.label}>
            Теги (через запятую)
            <input
              className={styles.input}
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="например: ML, NLP, Python"
            />
          </label>
          <div className={styles.actions}>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
