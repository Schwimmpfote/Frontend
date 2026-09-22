export type PerformanceCategory = 'Sale' | 'Production';

export interface PerformanceRecordInsert {
  category: PerformanceCategory;
  amount: number;
  day: string;
  ignore: boolean;
}
