import { useState, useEffect, type ReactNode } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { analyticsApi } from '../../api';
import type { TrendItem, SupervisorStats, ScoreDistribution, DashboardData } from '../../types';
import styles from './Analytics.module.css';

const CHART_COLORS = ['#6366F1', '#2DD4BF', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function AnalyticsPage(): ReactNode {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [supervisorStats, setSupervisorStats] = useState<SupervisorStats[]>([]);
  const [scores, setScores] = useState<ScoreDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async (): Promise<void> => {
      try {
        const [dashData, trendsData, supData, scoresData] = await Promise.all([
          analyticsApi.getDashboard().catch(() => null),
          analyticsApi.getTrends().catch(() => [] as TrendItem[]),
          analyticsApi.getSupervisorStats().catch(() => [] as SupervisorStats[]),
          analyticsApi.getScoreDistribution().catch(() => [] as ScoreDistribution[]),
        ]);
        setDashboard(dashData);
        setTrends(trendsData);
        setSupervisorStats(supData);
        setScores(scoresData);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return <div className={styles.loading}>Загрузка аналитики...</div>;
  }

  // Group trends by year for line chart
  const trendYears = [...new Set(trends.map((t) => t.year))].sort();
  const trendCategories = [...new Set(trends.map((t) => t.category))];
  const lineData = trendYears.map((year) => {
    const entry: Record<string, number | string> = { year: String(year) };
    trendCategories.forEach((cat) => {
      const item = trends.find((t) => t.year === year && t.category === cat);
      entry[cat] = item?.count ?? 0;
    });
    return entry;
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Аналитика</h1>
        <p className={styles.subtitle}>Статистика и тренды дипломных работ</p>
      </div>

      {/* Stats */}
      {dashboard && (
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <div className={styles.statValue}>{String(dashboard.totalWorks)}</div>
            <div className={styles.statLabel}>Всего работ</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{String(dashboard.totalUsers)}</div>
            <div className={styles.statLabel}>Пользователей</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{String(dashboard.totalSupervisors)}</div>
            <div className={styles.statLabel}>Руководителей</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>
              {dashboard.avgQualityScore > 0 ? `${String(Math.round(dashboard.avgQualityScore))}%` : '—'}
            </div>
            <div className={styles.statLabel}>Средняя оценка</div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className={styles.chartsGrid}>
        {/* Trends */}
        <div className={styles.chartCardFull}>
          <div className={styles.chartTitle}>Тренды тем по годам</div>
          <div className={styles.chartWrap}>
            {lineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                  <XAxis dataKey="year" stroke="#71717A" fontSize={12} />
                  <YAxis stroke="#71717A" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: '#18181B',
                      border: '1px solid #27272A',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  {trendCategories.slice(0, 5).map((cat, i) => (
                    <Line
                      key={cat}
                      type="monotone"
                      dataKey={cat}
                      stroke={CHART_COLORS[i % CHART_COLORS.length]}
                      strokeWidth={2}
                      dot={{ fill: CHART_COLORS[i % CHART_COLORS.length], r: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.loading}>Нет данных о трендах</div>
            )}
          </div>
        </div>

        {/* Score Distribution */}
        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>Распределение оценок</div>
          <div className={styles.chartWrap}>
            {scores.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                  <XAxis dataKey="range" stroke="#71717A" fontSize={12} />
                  <YAxis stroke="#71717A" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: '#18181B',
                      border: '1px solid #27272A',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.loading}>Нет данных</div>
            )}
          </div>
        </div>

        {/* Supervisors Pie */}
        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>Работы по руководителям</div>
          <div className={styles.chartWrap}>
            {supervisorStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={supervisorStats.slice(0, 6)}
                    dataKey="totalWorks"
                    nameKey="supervisorName"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    strokeWidth={1}
                    stroke="#27272A"
                  >
                    {supervisorStats.slice(0, 6).map((_, i) => (
                      <Cell key={`cell-${String(i)}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#18181B',
                      border: '1px solid #27272A',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.loading}>Нет данных</div>
            )}
          </div>
        </div>
      </div>

      {/* Supervisor Table */}
      {supervisorStats.length > 0 && (
        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <div className={styles.tableTitle}>Статистика руководителей</div>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Руководитель</th>
                <th>Работ</th>
                <th>Средняя оценка</th>
              </tr>
            </thead>
            <tbody>
              {supervisorStats.map((sup) => (
                <tr key={sup.supervisorId}>
                  <td>{sup.supervisorName}</td>
                  <td>{String(sup.totalWorks)}</td>
                  <td>{sup.avgScore > 0 ? `${String(Math.round(sup.avgScore))}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
