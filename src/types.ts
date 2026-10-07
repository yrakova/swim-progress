export interface Athlete {
  name: string;
  birthDate: string;
  city: string;
  sport: string;
}

export interface SwimResult {
  id: number;
  startDate: string;
  endDate: string;
  city: string;
  competition: string;
  poolLength: 25 | 50;
  stroke: string;
  distance: number;
  time: string;
  timeSeconds: number;
  rank: string;
  sourceType: string;
  sourceUrl: string;
}

export interface SwimData {
  athlete: Athlete;
  generatedAt: string;
  sourceWorkbook: string;
  results: SwimResult[];
}

export interface FiltersState {
  year: string;
  pool: string;
  stroke: string;
  distance: string;
}

export interface ResultSeries {
  key: string;
  stroke: string;
  distance: number;
  poolLength: number;
  results: SwimResult[];
  first: SwimResult;
  latest: SwimResult;
  best: SwimResult;
  improvementSeconds: number;
  improvementPercent: number;
}
