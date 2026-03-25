import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from './Home.module.css';

export function HomePage(): ReactNode {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroIcon}>🎓</div>
        <h1 className={styles.heroTitle}>
          Архив <span className={styles.heroHighlight}>дипломных работ</span>
        </h1>
        <p className={styles.heroSub}>
          Цифровая платформа Университета практической психологии
          для хранения, поиска и анализа выпускных квалификационных работ
        </p>
        <div className={styles.heroActions}>
          <Link to="/catalog" className={styles.heroBtnPrimary}>
            Каталог работ
          </Link>
          <Link to="/register" className={styles.heroBtnSecondary}>
            Начать работу
          </Link>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>🔍</div>
          <h3 className={styles.featureTitle}>Умный поиск</h3>
          <p className={styles.featureDesc}>
            Полнотекстовый поиск с русской морфологией, нечёткое совпадение
            и автодополнение. Находите работы по содержимому PDF.
          </p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>📊</div>
          <h3 className={styles.featureTitle}>Аналитика трендов</h3>
          <p className={styles.featureDesc}>
            Визуализация тематических трендов в психологии по годам,
            распределение оценок и статистика руководителей.
          </p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>⭐</div>
          <h3 className={styles.featureTitle}>Структурированные рецензии</h3>
          <p className={styles.featureDesc}>
            Объективная оценка по критериям с автоматическим расчётом
            коэффициента качества работы.
          </p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>📄</div>
          <h3 className={styles.featureTitle}>Парсинг PDF</h3>
          <p className={styles.featureDesc}>
            Автоматическое извлечение текста из загружаемых PDF-файлов
            для мгновенной индексации и поиска.
          </p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>🎯</div>
          <h3 className={styles.featureTitle}>Жизненный цикл</h3>
          <p className={styles.featureDesc}>
            Полный путь работы: от выбора темы через рецензирование
            до защиты и публикации в архиве.
          </p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>👥</div>
          <h3 className={styles.featureTitle}>Каталог руководителей</h3>
          <p className={styles.featureDesc}>
            Выбор научного руководителя с информацией о специализации,
            средней оценке и количестве работ.
          </p>
        </div>
      </section>
    </>
  );
}
