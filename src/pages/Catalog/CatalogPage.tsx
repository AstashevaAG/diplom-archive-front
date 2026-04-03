import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { searchApi, worksApi } from '../../api';
import { useDebounce } from '../../hooks';
import { WORK_STATUS_LABELS } from '../../utils/constants';
import { SortBy, StatusFilter, type Work, type SearchResult, type SuggestResult, type SearchResponse } from '../../types';
import styles from './Catalog.module.css';

function getScoreClass(score: number | null): string {
  if (score === null) return '';
  if (score >= 70) return styles.scoreHigh;
  if (score >= 40) return styles.scoreMedium;
  return styles.scoreLow;
}

export function CatalogPage(): ReactNode {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [works, setWorks] = useState<Work[]>([]);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [sortBy, setSortBy] = useState<SortBy>(SortBy.NEWEST);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(StatusFilter.PUBLISHED);
  const [minScore, setMinScore] = useState('');

  const debouncedQuery = useDebounce(query, 300);

  const loadWorks = useCallback(async (pageNum: number): Promise<void> => {
    setIsLoading(true);
    try {
      const result = await worksApi.getAll({
        page: pageNum,
        limit: 12,
        sortBy,
        statusFilter,
        minScore: minScore ? parseFloat(minScore) : undefined,
      });
      setWorks(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, [sortBy, statusFilter, minScore]);

  useEffect(() => {
    if (!isSearchMode) {
      void loadWorks(page);
    }
  }, [page, isSearchMode, loadWorks]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [sortBy, statusFilter, minScore]);

  // Autocomplete suggestions
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    void searchApi.suggest(debouncedQuery).then(setSuggestions).catch(() => {
      setSuggestions([]);
    });
  }, [debouncedQuery]);

  const handleSearch = async (): Promise<void> => {
    if (!query.trim()) {
      setIsSearchMode(false);
      return;
    }
    setIsLoading(true);
    setIsSearchMode(true);
    setShowSuggestions(false);
    try {
      const result = await searchApi.search({ q: query, page: 1, limit: 12 });
      setSearchResponse(result);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch {
      setSearchResponse(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (title: string): void => {
    setQuery(title);
    setShowSuggestions(false);
    void (async (): Promise<void> => {
      setIsLoading(true);
      setIsSearchMode(true);
      try {
        const result = await searchApi.search({ q: title, page: 1, limit: 12 });
        setSearchResponse(result);
        setTotalPages(result.totalPages);
        setTotal(result.total);
      } catch {
        setSearchResponse(null);
      } finally {
        setIsLoading(false);
      }
    })();
  };

  const searchResults: SearchResult[] = searchResponse?.data ?? [];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {isSearchMode ? 'Результаты поиска' : 'Каталог работ'}
        </h1>
      </div>

      <div className={styles.searchSection}>
        <div className={styles.searchBar}>
          <span className={styles.searchIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Поиск по темам, содержимому, аннотациям... (поддерживается неправильная раскладка)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
              if (!e.target.value.trim()) setIsSearchMode(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleSearch();
            }}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className={styles.suggestions}>
              {suggestions.map((s) => (
                <div
                  key={s.id}
                  className={styles.suggestionItem}
                  onMouseDown={() => handleSuggestionClick(s.title)}
                >
                  {s.title}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!isSearchMode && (
        <div className={styles.filtersBar}>
          <select
            className={styles.filterSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
          >
            <option value={SortBy.NEWEST}>Сначала новые</option>
            <option value={SortBy.OLDEST}>Сначала старые</option>
            <option value={SortBy.SCORE_DESC}>По оценке ↓</option>
            <option value={SortBy.SCORE_ASC}>По оценке ↑</option>
          </select>

          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value={StatusFilter.PUBLISHED}>Завершённые</option>
            <option value={StatusFilter.IN_PROGRESS}>В процессе</option>
            <option value={StatusFilter.ALL}>Все</option>
          </select>

          <input
            type="number"
            className={styles.filterSelect}
            placeholder="Мин. оценка %"
            min={0}
            max={100}
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            style={{ width: '130px' }}
          />

          {!isLoading && (
            <span className={styles.filterCount}>
              {total} {total === 1 ? 'работа' : total < 5 ? 'работы' : 'работ'}
            </span>
          )}
        </div>
      )}

      {isSearchMode && searchResponse?.convertedQuery && (
        <div className={styles.convertedHint}>
          Поиск также выполнен по варианту: «{searchResponse.convertedQuery}»
        </div>
      )}

      {isLoading ? (
        <div className={styles.empty}>Загрузка...</div>
      ) : isSearchMode ? (
        searchResults.length === 0 ? (
          <div className={styles.empty}>По вашему запросу ничего не найдено</div>
        ) : (
          <>
            <div className={styles.filterCount} style={{ marginBottom: '0.75rem' }}>
              Найдено: {total}
            </div>
            <div className={styles.grid}>
              {searchResults.map((result) => (
                <Link to={`/catalog/${result.id}`} className={styles.card} key={result.id}>
                  <div className={styles.cardTitle}>{result.title}</div>
                  {result.headline && (
                    <div
                      className={styles.cardAnnotation}
                      dangerouslySetInnerHTML={{ __html: result.headline }}
                    />
                  )}
                  <div className={styles.cardMeta}>
                    <span>{result.authorName}</span>
                    {result.supervisorName && <span>{result.supervisorName}</span>}
                    {result.year && <span>{String(result.year)}</span>}
                    {result.qualityScore !== null && (
                      <span className={getScoreClass(result.qualityScore)}>
                        {String(result.qualityScore)}%
                      </span>
                    )}
                  </div>
                  {(result.tags?.length ?? 0) > 0 && (
                    <div className={styles.tags}>
                      {result.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className={styles.tag}>{tag}</span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </>
        )
      ) : works.length === 0 ? (
        <div className={styles.empty}>Работы пока не добавлены</div>
      ) : (
        <>
          <div className={styles.grid}>
            {works.map((work) => {
              const isInProgress = statusFilter === StatusFilter.IN_PROGRESS;
              if (isInProgress) {
                return (
                  <div key={work.id} className={`${styles.card} ${styles.inProgressCard}`}>
                    <div className={styles.cardTitle}>{work.title}</div>
                    {work.description?.trim() && (
                      <div className={styles.cardDescription}>{work.description}</div>
                    )}
                    {work.annotation?.trim() && (
                      <div className={styles.cardAnnotation}>{work.annotation}</div>
                    )}
                    <div className={styles.cardMeta}>
                      <span>{work.author.fullName}</span>
                      {work.supervisor && <span>{work.supervisor.fullName}</span>}
                      <span className={styles.inProgressBadge}>
                        {WORK_STATUS_LABELS[work.status] ?? work.status}
                      </span>
                    </div>
                    {(work.tags?.length ?? 0) > 0 && (
                      <div className={styles.tags}>
                        {work.tags.slice(0, 4).map((tag) => (
                          <span key={tag} className={styles.tag}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <Link to={`/catalog/${work.id}`} className={styles.card} key={work.id}>
                  <div className={styles.cardTitle}>{work.title}</div>
                  {work.description?.trim() && (
                    <div className={styles.cardDescription}>{work.description}</div>
                  )}
                  {work.annotation?.trim() && (
                    <div className={styles.cardAnnotation}>{work.annotation}</div>
                  )}
                  <div className={styles.cardMeta}>
                    <span>{work.author.fullName}</span>
                    {work.supervisor && <span>{work.supervisor.fullName}</span>}
                    {work.year && <span>{String(work.year)}</span>}
                    <span className={styles.badge}>
                      {WORK_STATUS_LABELS[work.status] ?? work.status}
                    </span>
                    {work.qualityScore !== null && (
                      <span className={getScoreClass(work.qualityScore)}>
                        {String(work.qualityScore)}%
                      </span>
                    )}
                  </div>
                  {(work.tags?.length ?? 0) > 0 && (
                    <div className={styles.tags}>
                      {work.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className={styles.tag}>{tag}</span>
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={p === page ? styles.pageBtnActive : styles.pageBtn}
                  onClick={() => setPage(p)}
                >
                  {String(p)}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
