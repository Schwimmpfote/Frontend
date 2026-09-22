/**
 * Defines the two business areas for which performance records can be stored.
 * The category determines whether the recorded quantity belongs to sales or production.
 */
export type PerformanceCategory = 'Sale' | 'Production';


/**
 * Represents a performance entry that can be persisted for a specific day.
 * The ignore flag allows an entry to remain available without contributing
 * to the relevant performance evaluation.
 */
export interface PerformanceRecordInsert {
  category: PerformanceCategory;
  amount: number;
  day: string;
  ignore: boolean;
}
