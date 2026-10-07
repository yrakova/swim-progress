import type { FiltersState, ResultSeries, SwimResult } from '../types';

const rankPriority: Record<string, number> = {
  'МСМК': 0,
  'МС': 1,
  'КМС': 2,
  'I': 3,
  'II': 4,
  'III': 5,
  'I юн.': 6,
  'I (ю)': 6,
  'II юн.': 7,
  'II (ю)': 7,
  'III юн.': 8,
  'III (ю)': 8,
  'Без разряда': 99,
  '': 99,
};

export const shortRank = (rank: string) => {
  if (!rank || rank === 'Без разряда') return '—';
  return rank.replace('I (ю)', 'I юн.').replace('II (ю)', 'II юн.').replace('III (ю)', 'III юн.');
};

export const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds - minutes * 60;
  return minutes > 0 ? `${minutes}:${rest.toFixed(2).padStart(5, '0')}` : rest.toFixed(2);
};

export const formatDate = (iso: string, withYear = true) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    ...(withYear ? { year: 'numeric' as const } : {}),
  }).format(new Date(`${iso}T12:00:00`));

export const formatLongDate = (iso: string) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${iso}T12:00:00`));

export function filterResults(results: SwimResult[], filters: FiltersState) {
  return results.filter((result) => {
    const yearMatches = filters.year === 'all' || result.startDate.startsWith(filters.year);
    const poolMatches = filters.pool === 'all' || result.poolLength === Number(filters.pool);
    const strokeMatches = filters.stroke === 'all' || result.stroke === filters.stroke;
    const distanceMatches = filters.distance === 'all' || result.distance === Number(filters.distance);
    return yearMatches && poolMatches && strokeMatches && distanceMatches;
  });
}

export function buildSeries(results: SwimResult[]): ResultSeries[] {
  const groups = new Map<string, SwimResult[]>();

  results.forEach((result) => {
    const key = `${result.stroke}|${result.distance}|${result.poolLength}`;
    groups.set(key, [...(groups.get(key) ?? []), result]);
  });

  return [...groups.entries()].map(([key, group]) => {
    const ordered = [...group].sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id - b.id);
    const first = ordered[0];
    const latest = ordered.at(-1) ?? first;
    const best = ordered.reduce((current, item) => item.timeSeconds < current.timeSeconds ? item : current);
    const improvementSeconds = Math.max(0, first.timeSeconds - best.timeSeconds);
    return {
      key,
      stroke: first.stroke,
      distance: first.distance,
      poolLength: first.poolLength,
      results: ordered,
      first,
      latest,
      best,
      improvementSeconds,
      improvementPercent: first.timeSeconds > 0 ? improvementSeconds / first.timeSeconds * 100 : 0,
    };
  });
}

export function getMainSeries(series: ResultSeries[]) {
  const preferred = series.find((item) =>
    item.stroke === 'Комплексное плавание' && item.distance === 100 && item.poolLength === 25,
  );
  return preferred ?? [...series].sort((a, b) => b.results.length - a.results.length)[0];
}

export function getBestRank(results: SwimResult[]) {
  const ranked = results.filter((result) => result.rank && result.rank !== 'Без разряда');
  if (!ranked.length) return { rank: '—', count: 0 };
  const bestRank = ranked.reduce((current, result) =>
    (rankPriority[result.rank] ?? 98) < (rankPriority[current] ?? 98) ? result.rank : current,
  ranked[0].rank);
  return {
    rank: shortRank(bestRank),
    count: ranked.filter((result) => result.rank === bestRank).length,
  };
}

export const strokeShortName = (stroke: string) => {
  const map: Record<string, string> = {
    'Комплексное плавание': 'Комплекс',
    'Вольный стиль': 'Вольный стиль',
    'На спине': 'На спине',
    'Баттерфляй': 'Баттерфляй',
    'Брасс': 'Брасс',
  };
  return map[stroke] ?? stroke;
};

export function getProgressByStroke(series: ResultSeries[]) {
  const strokes = ['Вольный стиль', 'Комплексное плавание', 'На спине', 'Брасс'];
  return strokes
    .map((stroke) => {
      const candidates = series.filter((item) => item.stroke === stroke && item.results.length >= 2);
      return [...candidates].sort((a, b) => b.improvementPercent - a.improvementPercent)[0];
    })
    .filter((item): item is ResultSeries => Boolean(item));
}

export function getPersonalRecords(series: ResultSeries[]) {
  const preferred = [
    ['Брасс', 50, 25],
    ['На спине', 100, 25],
    ['Вольный стиль', 100, 25],
    ['Комплексное плавание', 100, 25],
    ['Баттерфляй', 50, 25],
    ['Вольный стиль', 800, 50],
  ] as const;

  return preferred
    .map(([stroke, distance, pool]) => series.find((item) =>
      item.stroke === stroke && item.distance === distance && item.poolLength === pool,
    ))
    .filter((item): item is ResultSeries => Boolean(item));
}

export function uniqueCompetitions(results: SwimResult[]) {
  return new Set(results.map((result) => `${result.startDate}|${result.competition}`)).size;
}
