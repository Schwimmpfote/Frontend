export interface EvaluationDay {
  day: string;
  production: number;
  sale: number;
  difference: number;
}

export interface EvaluationPeriod {
  production: number;
  sale: number;
  difference: number;
}

export interface EvaluationWorkstep {
  workstep_id: number;
  name: string;
  duration: number;
  amount: number;
  duration_per_piece: number;
}

export interface EvaluationEmployeeWorkstep {
  employee_id: number;
  employee_name: string;
  workstep_id: number;
  workstep_name: string;
  duration: number;
  amount: number;
  duration_per_piece: number;
}

export interface Evaluation {
  daily: EvaluationDay[];

  weekly: EvaluationPeriod;
  monthly: EvaluationPeriod;
  yearly: EvaluationPeriod;

  worksteps: EvaluationWorkstep[];

  employees: EvaluationEmployeeWorkstep[];
}
