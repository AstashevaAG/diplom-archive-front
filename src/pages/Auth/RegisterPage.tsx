import { useState, type ReactNode, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { Role, type RegisterData } from '../../types';
import { AxiosError } from 'axios';
import styles from './Auth.module.css';

export function RegisterPage(): ReactNode {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<RegisterData>({
    fullName: '',
    email: '',
    password: '',
    role: Role.STUDENT,
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const message = (err.response?.data as { message?: string })?.message;
        setError(message ?? 'Ошибка регистрации');
      } else {
        setError('Неизвестная ошибка');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = <K extends keyof RegisterData>(
    key: K,
    value: RegisterData[K],
  ): void => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconWrap}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" x2="19" y1="8" y2="14" />
              <line x1="22" x2="16" y1="11" y2="11" />
            </svg>
          </div>
          <h1 className={styles.title}>Регистрация</h1>
          <p className={styles.subtitle}>Создайте аккаунт для работы с архивом</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={(e) => void handleSubmit(e)}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="reg-name">ФИО</label>
            <input
              id="reg-name"
              type="text"
              className={styles.input}
              placeholder="Иванов Иван Иванович"
              value={formData.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              className={styles.input}
              placeholder="ivanov@university.ru"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="reg-password">Пароль</label>
            <input
              id="reg-password"
              type="password"
              className={styles.input}
              placeholder="Минимум 8 символов"
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              minLength={8}
              required
            />
          </div>

          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="reg-role">Роль</label>
              <select
                id="reg-role"
                className={styles.select}
                value={formData.role}
                onChange={(e) => updateField('role', e.target.value as Role)}
              >
                <option value={Role.STUDENT}>Студент</option>
                <option value={Role.SUPERVISOR}>Руководитель</option>
              </select>
            </div>

            {formData.role === Role.STUDENT && (
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="reg-group">Группа</label>
                <input
                  id="reg-group"
                  type="text"
                  className={styles.input}
                  placeholder="221-322"
                  value={formData.group ?? ''}
                  onChange={(e) => updateField('group', e.target.value)}
                />
              </div>
            )}

            {formData.role === Role.SUPERVISOR && (
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="reg-spec">Специализация</label>
                <input
                  id="reg-spec"
                  type="text"
                  className={styles.input}
                  placeholder="Клиническая"
                  value={formData.specialization ?? ''}
                  onChange={(e) => updateField('specialization', e.target.value)}
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className={styles.footer}>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </div>
      </div>
    </div>
  );
}
