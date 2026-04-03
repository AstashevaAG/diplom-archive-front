import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { filesApi } from '../../api';
import { FileType } from '../../types';
import styles from './FilePreviewModal.module.css';

export interface PreviewFileInfo {
  id: string;
  originalName: string;
  type: string;
}

interface FilePreviewModalProps {
  file: PreviewFileInfo | null;
  onClose: () => void;
}

export function FilePreviewModal({ file, onClose }: FilePreviewModalProps): ReactNode {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!file) {
      setBlobUrl(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    urlRef.current = null;
    setBlobUrl(null);
    setError(null);
    setLoading(true);

    filesApi
      .getBlob(file.id)
      .then((blob) => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        setBlobUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError('Не удалось загрузить файл. Проверьте сеть или права доступа.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [file?.id]);

  useEffect(() => {
    if (!file) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [file, onClose]);

  if (!file) return null;

  const handleBackdrop = (e: MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleDownload = (): void => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = file.originalName;
    a.click();
  };

  const isPdf = file.type === FileType.PDF;
  const isVideo = file.type === FileType.VIDEO;

  return createPortal(
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="file-preview-title" onMouseDown={handleBackdrop}>
      <div className={styles.panel}>
        <div className={styles.toolbar}>
          <h2 id="file-preview-title" className={styles.title}>
            {file.originalName}
          </h2>
          <div className={styles.toolbarActions}>
            {blobUrl && (
              <button type="button" className={styles.secondaryBtn} onClick={handleDownload}>
                Скачать
              </button>
            )}
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
              ×
            </button>
          </div>
        </div>

        <div className={styles.body}>
          {loading && <div className={styles.centered}>Загрузка…</div>}
          {error && !loading && <div className={styles.error}>{error}</div>}
          {!loading && !error && blobUrl && isPdf && (
            <iframe title={file.originalName} src={blobUrl} className={styles.frame} />
          )}
          {!loading && !error && blobUrl && isVideo && (
            <video src={blobUrl} controls className={styles.video} playsInline />
          )}
          {!loading && !error && blobUrl && !isPdf && !isVideo && (
            <div className={styles.fallback}>
              <p>Предпросмотр этого типа файла недоступен в браузере.</p>
              <button type="button" className={styles.primaryBtn} onClick={handleDownload}>
                Скачать файл
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
