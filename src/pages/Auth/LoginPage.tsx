import { useState, type ReactNode, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks';
import type { LoginData } from '../../types';
import { AxiosError } from 'axios';
import styles from './Auth.module.css';

export function LoginPage(): ReactNode {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(formData);
      navigate('/dashboard');
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const message = (err.response?.data as { message?: string })?.message;
        setError(message ?? 'Ошибка авторизации');
      } else {
        setError('Неизвестная ошибка');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Вход в систему</h1>
      <p className={styles.subtitle}>Архив дипломных работ</p>

      {error && <div className={styles.error}>{error}</div>}

      <form className={styles.form} onSubmit={(e) => void handleSubmit(e)}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            className={styles.input}
            placeholder="ivanov@university.ru"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="login-password">Пароль</label>
          <input
            id="login-password"
            type="password"
            className={styles.input}
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
        </div>

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Вход...' : 'Войти'}
        </button>
      </form>

      <div className={styles.footer}>
        Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </div>
    </div>
  );
}
