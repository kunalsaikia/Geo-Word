
export interface MigrationPoint {
  year: number;
  latitude: number;
  longitude: number;
  language: string;
  word: string;
  description: string;
  region: string;
}

export interface WordEvolution {
  originWord: string;
  modernWord: string;
  etymologySummary: string;
  timeline: MigrationPoint[];
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
