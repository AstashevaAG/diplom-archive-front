import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from './Home.module.css';

export function HomePage(): ReactNode {
  return (
    <>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          <span className={styles.heroBadgeDot} />
          Университет практической психологии
        </div>

        <h1 className={styles.heroTitle}>
          Архив <span className={styles.heroHighlight}>дипломных работ</span>
        </h1>
        <p className={styles.heroSub}>
          Цифровая платформа для систематизации, хранения и поиска дипломных
          работ
        </p>
        <div className={styles.heroActions}>
          <Link to="/catalog" className={styles.heroBtnPrimary}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            Каталог работ
          </Link>
          <Link to="/register" className={styles.heroBtnSecondary}>
            Начать работу
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className={styles.stats}>
        <div className={styles.statItem}>
          <div className={styles.statValue}>500+</div>
          <div className={styles.statLabel}>работ в архиве</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statValue}>50+</div>
          <div className={styles.statLabel}>преподавателей</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statValue}>98%</div>
          <div className={styles.statLabel}>успешных защит</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statValue}>10 лет</div>
          <div className={styles.statLabel}>истории</div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.featuresSection}>
        <div className={styles.featuresHeader}>
          <div className={styles.featuresLabel}>Возможности</div>
          <h2 className={styles.featuresTitle}>Всё для работы с дипломом</h2>
        </div>

        <div className={styles.features}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Умный поиск</h3>
            <p className={styles.featureDesc}>
              Полнотекстовый поиск с русской морфологией, нечёткое совпадение
              и автодополнение по содержимому PDF.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Аналитика трендов</h3>
            <p className={styles.featureDesc}>
              Визуализация тематических трендов по годам, распределение оценок
              и статистика преподавателей.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Рецензирование</h3>
            <p className={styles.featureDesc}>
              Структурированная оценка по критериям с автоматическим расчётом
              коэффициента качества.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                <path d="M10 9H8" />
                <path d="M16 13H8" />
                <path d="M16 17H8" />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Информационный центр</h3>
            <p className={styles.featureDesc}>
              Полезные статьи, памятки и инструкции по подготовке диплома,
              поиску работ и взаимодействию с преподавателем.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Жизненный цикл</h3>
            <p className={styles.featureDesc}>
              Полный путь работы: от выбора темы через рецензирование до защиты
              и публикации в архиве.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Каталог преподавателей</h3>
            <p className={styles.featureDesc}>
              Выбор преподавателя с информацией о специализации и
              количестве работ.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <h2 className={styles.ctaTitle}>Готовы начать?</h2>
        <p className={styles.ctaText}>
          Зарегистрируйтесь, чтобы загрузить свою работу или исследовать архив
        </p>
        <Link to="/register" className={styles.heroBtnPrimary}>
          Создать аккаунт
        </Link>
      </section>
    </>
  );
}
