import { useState, useEffect, type ReactNode, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { usersApi } from '../../api';
import { ROLE_LABELS } from '../../utils/constants';
import { Role } from '../../types';
import styles from './Profile.module.css';

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
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

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setBio(user.bio ?? '');
      setGroup(user.group ?? '');
      setSpecialization(user.specialization ?? '');
    }
  }, [user]);

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

      {/* Tabs */}
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
          <div className={styles.avatar}>
            {getInitials(user.fullName)}
          </div>
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
    </div>
  );
}
