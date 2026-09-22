/**
 * Contains the production and sales figures for one calendar day.
 * The difference represents the remaining amount after sales.
 */
export interface EvaluationDay {
  day: string;
  production: number;
  sale: number;
  difference: number;
}


/**
 * Represents aggregated production figures for a complete evaluation period.
 * The same structure is used for different period lengths.
 */
export interface EvaluationPeriod {
  production: number;
  sale: number;
  difference: number;
}


/**
 * Describes the workload and output of a single production work step.
 * The duration-per-piece value allows the processing efficiency to be compared
 * independently of the total quantity produced.
 */
export interface EvaluationWorkstep {
  workstep_id: number;
  name: string;
  duration: number;
  amount: number;
  duration_per_piece: number;
}


/**
 * Associates an employee with a work step and records their contribution
 * to the corresponding production activity.
 */
export interface EvaluationEmployeeWorkstep {
  employee_id: number;
  employee_name: string;
  workstep_id: number;
  workstep_name: string;
  duration: number;
  amount: number;
  duration_per_piece: number;
}


/**
 * Contains the complete evaluation response returned by the production API.
 * It combines daily data, predefined period aggregates and detailed
 * work-step information, including employee-specific assignments.
 */
export interface Evaluation {
  daily: EvaluationDay[];

  weekly: EvaluationPeriod;
  monthly: EvaluationPeriod;
  yearly: EvaluationPeriod;

  worksteps: EvaluationWorkstep[];

  employees: EvaluationEmployeeWorkstep[];
}
