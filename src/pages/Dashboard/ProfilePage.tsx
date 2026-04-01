import { useState, useEffect, type ReactNode, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { usersApi, portfolioApi } from '../../api';
import { ROLE_LABELS } from '../../utils/constants';
import { Role, PortfolioItemType, PORTFOLIO_TYPE_LABELS, type StudentPortfolioItem, type CreatePortfolioItemData } from '../../types';
import styles from './Profile.module.css';

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

interface PortfolioFormProps {
  onAdd: (item: StudentPortfolioItem) => void;
}

function PortfolioForm({ onAdd }: PortfolioFormProps): ReactNode {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<PortfolioItemType>(PortfolioItemType.COURSEWORK);
  const [description, setDescription] = useState('');
  const [year, setYear] = useState('');
  const [grade, setGrade] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    setError('');
    try {
      const data: CreatePortfolioItemData = {
        title: title.trim(),
        type,
        description: description.trim() || undefined,
        year: year ? parseInt(year, 10) : undefined,
        grade: grade.trim() || undefined,
      };
      const item = await portfolioApi.create(data);
      onAdd(item);
      setTitle('');
      setDescription('');
      setYear('');
      setGrade('');
    } catch {
      setError('Не удалось добавить. Попробуйте ещё раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles.portfolioForm} onSubmit={(e) => void handleSubmit(e)}>
      <div className={styles.portfolioFormTitle}>Добавить работу в портфолио</div>
      {error && <div className={styles.error} style={{ margin: 0 }}>{error}</div>}
      <div className={styles.row}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="pf-title">Название *</label>
          <input
            id="pf-title"
            type="text"
            className={styles.input}
            placeholder="Название работы"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="pf-type">Тип</label>
          <select
            id="pf-type"
            className={styles.input}
            value={type}
            onChange={(e) => setType(e.target.value as PortfolioItemType)}
          >
            {Object.values(PortfolioItemType).map((t) => (
              <option key={t} value={t}>{PORTFOLIO_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="pf-desc">Описание</label>
        <textarea
          id="pf-desc"
          className={styles.textarea}
          placeholder="Краткое описание работы..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className={styles.row}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="pf-year">Год</label>
          <input
            id="pf-year"
            type="number"
            className={styles.input}
            placeholder="2024"
            min={1950}
            max={2100}
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="pf-grade">Оценка</label>
          <input
            id="pf-grade"
            type="text"
            className={styles.input}
            placeholder="Отлично / 5 / A"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          />
        </div>
      </div>
      <button type="submit" className={styles.btnPrimary} disabled={isSubmitting || !title.trim()}>
        {isSubmitting ? 'Добавление...' : 'Добавить'}
      </button>
    </form>
  );
}

interface PortfolioItemCardProps {
  item: StudentPortfolioItem;
  onDelete: (id: string) => void;
}

function PortfolioItemCard({ item, onDelete }: PortfolioItemCardProps): ReactNode {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (): Promise<void> => {
    if (!confirm('Удалить эту работу из портфолио?')) return;
    setDeleting(true);
    try {
      await portfolioApi.delete(item.id);
      onDelete(item.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.portfolioItem}>
      <div className={styles.portfolioItemHeader}>
        <div>
          <div className={styles.portfolioItemTitle}>{item.title}</div>
          <div className={styles.portfolioItemMeta}>
            <span className={styles.portfolioTypeBadge}>{PORTFOLIO_TYPE_LABELS[item.type]}</span>
            {item.year && <span>{item.year}</span>}
            {item.grade && <span className={styles.portfolioGrade}>{item.grade}</span>}
          </div>
        </div>
        <button
          type="button"
          className={styles.deleteBtn}
          onClick={() => void handleDelete()}
          disabled={deleting}
          title="Удалить"
        >
          ×
        </button>
      </div>
      {item.description && (
        <div className={styles.portfolioItemDesc}>{item.description}</div>
      )}
      {item.fileUrl && (
        <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.portfolioFileLink}>
          Открыть файл
        </a>
      )}
    </div>
  );
}

export function ProfilePage(): ReactNode {
  const { user, hasRole } = useAuth();
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [group, setGroup] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [portfolioItems, setPortfolioItems] = useState<StudentPortfolioItem[]>([]);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setBio(user.bio ?? '');
      setGroup(user.group ?? '');
      setSpecialization(user.specialization ?? '');
    }
  }, [user]);

  useEffect(() => {
    if (hasRole(Role.STUDENT)) {
      void portfolioApi.getMy().then(setPortfolioItems).catch(() => {});
    }
  }, [hasRole]);

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await usersApi.updateMe({
        fullName: fullName.trim(),
        bio: bio.trim() || undefined,
        group: group.trim() || undefined,
        specialization: specialization.trim() || undefined,
      });
      setSuccessMsg('Профиль обновлён');
    } catch {
      setErrorMsg('Не удалось сохранить');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Профиль</h1>
      </div>

      <div className={styles.tabs}>
        <Link to="/dashboard" className={styles.tab}>
          {hasRole(Role.SUPERVISOR) ? 'Подопечные' : 'Работы'}
        </Link>
        <Link to="/dashboard/profile" className={styles.tabActive}>
          Профиль
        </Link>
      </div>

      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>{getInitials(user.fullName)}</div>
          <div>
            <div className={styles.profileName}>{user.fullName}</div>
            <div className={styles.profileRole}>
              {ROLE_LABELS[user.role] ?? user.role} • {user.email}
            </div>
          </div>
        </div>

        {successMsg && <div className={styles.success}>{successMsg}</div>}
        {errorMsg && <div className={styles.error}>{errorMsg}</div>}

        <form className={styles.form} onSubmit={(e) => void handleSubmit(e)}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="profile-name">ФИО</label>
            <input
              id="profile-name"
              type="text"
              className={styles.input}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="profile-bio">О себе</label>
            <textarea
              id="profile-bio"
              className={styles.textarea}
              placeholder="Расскажите о себе..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div className={styles.row}>
            {hasRole(Role.STUDENT) && (
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="profile-group">Группа</label>
                <input
                  id="profile-group"
                  type="text"
                  className={styles.input}
                  placeholder="221-322"
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                />
              </div>
            )}
            {hasRole(Role.SUPERVISOR) && (
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="profile-spec">Специализация</label>
                <input
                  id="profile-spec"
                  type="text"
                  className={styles.input}
                  placeholder="Клиническая психология"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                />
              </div>
            )}
          </div>
        </form>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btnPrimary}
            disabled={isSaving}
            onClick={(e) => {
              const form = (e.target as HTMLElement).closest('div')?.parentElement?.querySelector('form');
              if (form) form.requestSubmit();
            }}
          >
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>

      {hasRole(Role.STUDENT) && (
        <div className={styles.portfolioSection}>
          <h2 className={styles.portfolioTitle}>Мои прошлые работы</h2>
          <p className={styles.portfolioHint}>
            Добавьте курсовые, личные проекты и другие работы — преподаватель сможет ознакомиться с ними при рассмотрении вашей заявки.
          </p>
          <PortfolioForm onAdd={(item) => setPortfolioItems((prev) => [item, ...prev])} />
          {portfolioItems.length > 0 && (
            <div className={styles.portfolioList}>
              {portfolioItems.map((item) => (
                <PortfolioItemCard
                  key={item.id}
                  item={item}
                  onDelete={(id) => setPortfolioItems((prev) => prev.filter((i) => i.id !== id))}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
