import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { searchApi, worksApi } from '../../api';
import { useDebounce } from '../../hooks';
import { WORK_STATUS_LABELS } from '../../utils/constants';
import type { Work, SearchResult, SuggestResult, PaginatedResponse } from '../../types';
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
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const debouncedQuery = useDebounce(query, 300);

  const loadWorks = useCallback(async (pageNum: number): Promise<void> => {
    setIsLoading(true);
    try {
      const result: PaginatedResponse<Work> = await worksApi.getAll({ page: pageNum, limit: 12 });
      setWorks(result.data);
      setTotalPages(result.totalPages);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSearchMode) {
      void loadWorks(page);
    }
  }, [page, isSearchMode, loadWorks]);

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
      setSearchResults(result.data);
      setTotalPages(result.totalPages);
    } catch {
      setSearchResults([]);
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
        setSearchResults(result.data);
        setTotalPages(result.totalPages);
      } catch {
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    })();
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {isSearchMode ? 'Результаты поиска' : 'Каталог работ'}
        </h1>
      </div>

      <div className={styles.searchSection}>
        <div className={styles.searchBar}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Поиск по работам, темам, содержимому PDF..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
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

      {isLoading ? (
        <div className={styles.empty}>Загрузка...</div>
      ) : isSearchMode ? (
        searchResults.length === 0 ? (
          <div className={styles.empty}>По вашему запросу ничего не найдено</div>
        ) : (
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
                  <span>👤 {result.authorName}</span>
                  {result.supervisorName && <span>📋 {result.supervisorName}</span>}
                  {result.year && <span>📅 {String(result.year)}</span>}
                  {result.qualityScore !== null && (
                    <span className={getScoreClass(result.qualityScore)}>
                      {String(result.qualityScore)}%
                    </span>
                  )}
                </div>
                {result.tags.length > 0 && (
                  <div className={styles.tags}>
                    {result.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className={styles.tag}>{tag}</span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )
      ) : works.length === 0 ? (
        <div className={styles.empty}>Работы пока не добавлены</div>
      ) : (
        <>
          <div className={styles.grid}>
            {works.map((work) => (
              <Link to={`/catalog/${work.id}`} className={styles.card} key={work.id}>
                <div className={styles.cardTitle}>{work.title}</div>
                {work.annotation && (
                  <div className={styles.cardAnnotation}>{work.annotation}</div>
                )}
                <div className={styles.cardMeta}>
                  <span>👤 {work.author.fullName}</span>
                  {work.supervisor && <span>📋 {work.supervisor.fullName}</span>}
                  {work.year && <span>📅 {String(work.year)}</span>}
                  <span className={styles.badge}>
                    {WORK_STATUS_LABELS[work.status] ?? work.status}
                  </span>
                  {work.qualityScore !== null && (
                    <span className={getScoreClass(work.qualityScore)}>
                      {String(work.qualityScore)}%
                    </span>
                  )}
                </div>
                {work.tags.length > 0 && (
                  <div className={styles.tags}>
                    {work.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className={styles.tag}>{tag}</span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
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
