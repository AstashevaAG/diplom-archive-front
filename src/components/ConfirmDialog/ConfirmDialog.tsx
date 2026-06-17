import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './ConfirmDialog.module.css';

type DialogVariant = 'info' | 'warning' | 'danger';

interface DialogOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
  confirmOnly?: boolean;
}

interface DialogState extends Required<Omit<DialogOptions, 'message'>> {
  message: string;
  resolve: (value: boolean) => void;
}

interface DialogContextValue {
  requestConfirmation: (options: DialogOptions) => Promise<boolean>;
  showMessage: (options: Omit<DialogOptions, 'cancelLabel' | 'confirmOnly'>) => Promise<void>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

function normalizeOptions(options: DialogOptions, resolve: (value: boolean) => void): DialogState {
  return {
    title: options.title,
    message: options.message ?? '',
    confirmLabel: options.confirmLabel ?? 'Подтвердить',
    cancelLabel: options.cancelLabel ?? 'Отмена',
    variant: options.variant ?? 'info',
    confirmOnly: options.confirmOnly ?? false,
    resolve,
  };
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }): ReactNode {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const dialogRef = useRef<DialogState | null>(null);

  useEffect(() => {
    dialogRef.current = dialog;
  }, [dialog]);

  const close = useCallback((value: boolean): void => {
    const current = dialogRef.current;
    if (!current) return;
    current.resolve(value);
    dialogRef.current = null;
    setDialog(null);
  }, []);

  const requestConfirmation = useCallback((options: DialogOptions): Promise<boolean> => {
    const current = dialogRef.current;
    if (current) {
      current.resolve(false);
    }

    return new Promise<boolean>((resolve) => {
      const nextDialog = normalizeOptions(options, resolve);
      dialogRef.current = nextDialog;
      setDialog(nextDialog);
    });
  }, []);

  const showMessage = useCallback(async (options: Omit<DialogOptions, 'cancelLabel' | 'confirmOnly'>): Promise<void> => {
    await requestConfirmation({ ...options, confirmOnly: true, confirmLabel: options.confirmLabel ?? 'Понятно' });
  }, [requestConfirmation]);

  useEffect(() => {
    if (!dialog) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') close(false);
      if (e.key === 'Enter') close(true);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dialog, close]);

  const value = useMemo<DialogContextValue>(
    () => ({ requestConfirmation, showMessage }),
    [requestConfirmation, showMessage],
  );

  const handleBackdrop = (e: MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) close(false);
  };

  const markClass = dialog?.variant === 'danger'
    ? `${styles.mark} ${styles.markDanger}`
    : dialog?.variant === 'warning'
      ? `${styles.mark} ${styles.markWarning}`
      : styles.mark;
  const confirmClass = dialog?.variant === 'danger'
    ? `${styles.button} ${styles.danger}`
    : `${styles.button} ${styles.primary}`;

  return (
    <DialogContext.Provider value={value}>
      {children}
      {dialog && createPortal(
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" onMouseDown={handleBackdrop}>
          <div className={styles.panel}>
            <div className={styles.header}>
              <div className={markClass} aria-hidden="true">
                {dialog.variant === 'danger' ? '!' : '?'}
              </div>
              <div>
                <h2 id="confirm-dialog-title" className={styles.title}>{dialog.title}</h2>
                {dialog.message && <p className={styles.message}>{dialog.message}</p>}
              </div>
            </div>
            <div className={styles.actions}>
              {!dialog.confirmOnly && (
                <button type="button" className={`${styles.button} ${styles.secondary}`} onClick={() => close(false)}>
                  {dialog.cancelLabel}
                </button>
              )}
              <button type="button" className={confirmClass} onClick={() => close(true)} autoFocus>
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </DialogContext.Provider>
  );
}

export function useConfirmDialog(): DialogContextValue {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useConfirmDialog must be used within ConfirmDialogProvider');
  }
  return context;
}
