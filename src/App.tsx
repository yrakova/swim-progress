import { useMemo, useState } from 'react';
import {
  AimOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  EnvironmentOutlined,
  FireOutlined,
  RiseOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { Alert, Button, Card, Select, Spin, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ProgressChart } from './components/ProgressChart';
import { RankTag } from './components/RankTag';
import { useSwimData } from './data/useSwimData';
import type { FiltersState, SwimResult } from './types';
import {
  buildSeries,
  filterResults,
  formatDate,
  formatLongDate,
  formatTime,
  getBestRank,
  getMainSeries,
  getPersonalRecords,
  getProgressByStroke,
  strokeShortName,
  uniqueCompetitions,
} from './utils/analytics';

const { Title, Text } = Typography;

const initialFilters: FiltersState = {
  year: 'all',
  pool: 'all',
  stroke: 'all',
  distance: 'all',
};

const progressIcons = [
  <ThunderboltOutlined key="freestyle" />,
  <AimOutlined key="medley" />,
  <SafetyCertificateOutlined key="backstroke" />,
  <FireOutlined key="breaststroke" />,
];

function App() {
  const { data, isLoading, error } = useSwimData();
  const [filters, setFilters] = useState(initialFilters);
  const [showAllResults, setShowAllResults] = useState(false);

  const allResults = useMemo(() => data?.results ?? [], [data]);
  const filteredResults = useMemo(() => filterResults(allResults, filters), [allResults, filters]);
  const allSeries = useMemo(() => buildSeries(allResults), [allResults]);
  const filteredSeries = useMemo(() => buildSeries(filteredResults), [filteredResults]);
  const mainSeries = useMemo(() => getMainSeries(filteredSeries), [filteredSeries]);
  const headlineSeries = useMemo(() => getMainSeries(allSeries), [allSeries]);
  const progress = useMemo(() => getProgressByStroke(allSeries), [allSeries]);
  const personalRecords = useMemo(() => getPersonalRecords(allSeries), [allSeries]);
  const bestRank = useMemo(() => getBestRank(filteredResults), [filteredResults]);

  const sortedResults = useMemo(
    () => [...filteredResults].sort((a, b) => b.startDate.localeCompare(a.startDate) || b.id - a.id),
    [filteredResults],
  );

  if (isLoading) {
    return (
      <main className="state-screen">
        <Spin size="large" />
        <Text type="secondary">Загружаем историю стартов…</Text>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="state-screen state-screen--error">
        <Alert
          type="error"
          showIcon
          message="Не удалось загрузить статистику"
          description={error instanceof Error ? error.message : 'Проверьте файл swimming-results.json.'}
        />
      </main>
    );
  }

  const years = [...new Set(allResults.map((result) => result.startDate.slice(0, 4)))].sort();
  const strokes = [...new Set(allResults.map((result) => result.stroke))].sort();
  const distances = [...new Set(allResults.map((result) => result.distance))].sort((a, b) => a - b);
  const cities = new Set(filteredResults.map((result) => result.city)).size;
  const firstDate = filteredResults.length
    ? [...filteredResults].sort((a, b) => a.startDate.localeCompare(b.startDate))[0].startDate
    : data.generatedAt;
  const latestDate = [...allResults].sort((a, b) => b.startDate.localeCompare(a.startDate))[0]?.startDate ?? data.generatedAt;

  const columns: ColumnsType<SwimResult> = [
    {
      title: 'Дата',
      dataIndex: 'startDate',
      width: 116,
      render: (date: string) => <span className="table-date">{formatDate(date)}</span>,
    },
    {
      title: 'Соревнование',
      dataIndex: 'competition',
      ellipsis: true,
      render: (competition: string, record) => (
        <a className="competition-link" href={record.sourceUrl} target="_blank" rel="noreferrer">
          {competition}
        </a>
      ),
    },
    {
      title: 'Дисциплина',
      key: 'discipline',
      width: 210,
      render: (_, record) => `${strokeShortName(record.stroke)}, ${record.distance} м`,
    },
    {
      title: 'Бассейн',
      dataIndex: 'poolLength',
      width: 110,
      render: (pool: number) => `${pool} м`,
    },
    {
      title: 'Время',
      dataIndex: 'timeSeconds',
      width: 100,
      render: (seconds: number) => <strong>{formatTime(seconds)}</strong>,
    },
    {
      title: 'Разряд',
      dataIndex: 'rank',
      width: 108,
      render: (rank: string) => <RankTag rank={rank} />,
    },
  ];

  const changeFilter = (name: keyof FiltersState, value: string) => {
    setFilters((current) => ({ ...current, [name]: value }));
    setShowAllResults(false);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="athlete-lockup">
          <div className="athlete-mark">AR</div>
          <div>
            <div className="athlete-name">{data.athlete.name}</div>
            <div className="athlete-meta">{data.athlete.city} · {formatLongDate(data.athlete.birthDate)}</div>
          </div>
        </div>

        <nav className="main-nav" aria-label="Разделы страницы">
          <Button type="text" onClick={() => document.querySelector('#overview')?.scrollIntoView({ behavior: 'smooth' })}>
            Обзор
          </Button>
          <Button type="text" onClick={() => document.querySelector('#progress')?.scrollIntoView({ behavior: 'smooth' })}>
            Прогресс
          </Button>
          <Button type="text" onClick={() => document.querySelector('#results')?.scrollIntoView({ behavior: 'smooth' })}>
            Результаты
          </Button>
        </nav>

        <div className="updated-badge">
          <CheckCircleFilled />
          Обновлено {formatLongDate(latestDate)}
        </div>
      </header>

      <main className="dashboard" id="overview">
        <section className="intro-row">
          <div>
            <Title level={1}>Прогресс спортсмена</Title>
            <Text className="intro-subtitle">Динамика результатов, личные рекорды и выполненные разряды</Text>
          </div>
          {headlineSeries && (
            <div className="headline-progress">
              <RiseOutlined />
              <strong>−{headlineSeries.improvementPercent.toFixed(1).replace('.', ',')}%</strong>
              <span>{headlineSeries.distance} м {strokeShortName(headlineSeries.stroke).toLowerCase()} · {headlineSeries.poolLength} м</span>
            </div>
          )}
        </section>

        <section className="filters" aria-label="Фильтры результатов">
          <div className="filter-field">
            <Text>Период</Text>
            <Select
              value={filters.year}
              onChange={(value) => changeFilter('year', value)}
              options={[
                { value: 'all', label: `${years[0]}–${years.at(-1)}` },
                ...years.map((year) => ({ value: year, label: year })),
              ]}
            />
          </div>
          <div className="filter-field">
            <Text>Бассейн</Text>
            <Select
              value={filters.pool}
              onChange={(value) => changeFilter('pool', value)}
              options={[
                { value: 'all', label: 'Все бассейны' },
                { value: '25', label: '25 м' },
                { value: '50', label: '50 м' },
              ]}
            />
          </div>
          <div className="filter-field">
            <Text>Стиль</Text>
            <Select
              value={filters.stroke}
              onChange={(value) => changeFilter('stroke', value)}
              options={[
                { value: 'all', label: 'Все стили' },
                ...strokes.map((stroke) => ({ value: stroke, label: strokeShortName(stroke) })),
              ]}
            />
          </div>
          <div className="filter-field">
            <Text>Дистанция</Text>
            <Select
              value={filters.distance}
              onChange={(value) => changeFilter('distance', value)}
              options={[
                { value: 'all', label: 'Все дистанции' },
                ...distances.map((distance) => ({ value: String(distance), label: `${distance} м` })),
              ]}
            />
          </div>
        </section>

        <section className="metrics-grid" aria-label="Основные показатели">
          <Card className="metric-card">
            <div className="metric-card__icon metric-card__icon--blue"><ClockCircleOutlined /></div>
            <div><Text>Результатов</Text><div className="metric-value">{filteredResults.length}</div><span>с {formatDate(firstDate)}</span></div>
          </Card>
          <Card className="metric-card">
            <div className="metric-card__icon metric-card__icon--gold"><TrophyOutlined /></div>
            <div><Text>Соревнований</Text><div className="metric-value">{uniqueCompetitions(filteredResults)}</div><span>официальные старты</span></div>
          </Card>
          <Card className="metric-card">
            <div className="metric-card__icon metric-card__icon--cyan"><EnvironmentOutlined /></div>
            <div><Text>Городов</Text><div className="metric-value">{cities}</div><span>{[...new Set(filteredResults.map((item) => item.city))].join(' · ') || '—'}</span></div>
          </Card>
          <Card className="metric-card">
            <div className="metric-card__icon metric-card__icon--violet"><SafetyCertificateOutlined /></div>
            <div><Text>Лучший разряд</Text><div className="metric-value">{bestRank.rank}</div><span>{bestRank.count} {bestRank.count === 1 ? 'результат' : 'результата'}</span></div>
          </Card>
        </section>

        {filteredResults.length === 0 ? (
          <Alert
            className="empty-state"
            type="info"
            showIcon
            message="Для выбранных фильтров результатов нет"
            action={<Button onClick={() => setFilters(initialFilters)}>Сбросить фильтры</Button>}
          />
        ) : (
          <>
            <section className="feature-grid" id="progress">
              {mainSeries && (
                <Card className="chart-card">
                  <div className="section-heading chart-heading">
                    <div>
                      <Text className="eyebrow">Динамика результата</Text>
                      <Title level={3}>{mainSeries.distance} м {strokeShortName(mainSeries.stroke).toLowerCase()} · бассейн {mainSeries.poolLength} м</Title>
                      <Text type="secondary">{mainSeries.results.length} стартов · быстрее — выше</Text>
                    </div>
                    <Tag color="success" className="improvement-tag">
                      <RiseOutlined /> −{mainSeries.improvementSeconds.toFixed(2).replace('.', ',')} с
                    </Tag>
                  </div>
                  <div className="chart-area"><ProgressChart series={mainSeries} /></div>
                  <div className="chart-legend">
                    <span><i className="legend-dot legend-dot--best" />Лучший результат</span>
                    <span><i className="legend-dot legend-dot--latest" />Последний результат</span>
                  </div>
                </Card>
              )}

              <Card className="records-card">
                <div className="section-heading">
                  <div>
                    <Text className="eyebrow">Личные рекорды</Text>
                    <Title level={3}>Лучшие результаты</Title>
                  </div>
                  <TrophyOutlined className="records-trophy" />
                </div>
                <div className="records-list">
                  {personalRecords.map((item) => (
                    <div className="record-row" key={item.key}>
                      <div>
                        <strong>{strokeShortName(item.stroke)}, {item.distance} м</strong>
                        <span>Бассейн {item.poolLength} м · {formatDate(item.best.startDate)}</span>
                      </div>
                      <div className="record-row__result">
                        <strong>{formatTime(item.best.timeSeconds)}</strong>
                        <RankTag rank={item.best.rank} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </section>

            <Card className="stroke-progress-card">
              <div className="section-heading">
                <div>
                  <Text className="eyebrow">Динамика по стилям</Text>
                  <Title level={3}>Прогресс от первого старта до личного рекорда</Title>
                </div>
              </div>
              <div className="stroke-grid">
                {progress.map((item, index) => (
                  <div className="stroke-card" key={item.key}>
                    <div className="stroke-card__top">
                      <div className="stroke-card__icon">{progressIcons[index]}</div>
                      <Tag color="success">−{item.improvementPercent.toFixed(1).replace('.', ',')}%</Tag>
                    </div>
                    <strong className="stroke-card__name">{strokeShortName(item.stroke)}</strong>
                    <span>{item.distance} м · бассейн {item.poolLength} м</span>
                    <div className="stroke-card__times">
                      <span>{formatTime(item.first.timeSeconds)}</span>
                      <RiseOutlined />
                      <strong>{formatTime(item.best.timeSeconds)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="results-card" id="results">
              <div className="section-heading results-heading">
                <div>
                  <Text className="eyebrow">История стартов</Text>
                  <Title level={3}>Последние результаты</Title>
                </div>
                <Button type="link" onClick={() => setShowAllResults((value) => !value)}>
                  {showAllResults ? 'Показать последние' : `Все результаты (${sortedResults.length})`}
                </Button>
              </div>
              <Table
                rowKey="id"
                columns={columns}
                dataSource={showAllResults ? sortedResults : sortedResults.slice(0, 5)}
                pagination={showAllResults ? { pageSize: 10, showSizeChanger: false } : false}
                scroll={{ x: 980 }}
              />
            </Card>
          </>
        )}

        <footer className="page-footer">
          <span>Данные собраны из открытых протоколов соревнований</span>
          <span>Расчёт разрядов — по действующим нормативам РФ на дату старта</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
