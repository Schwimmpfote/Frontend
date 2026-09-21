export interface WorkprocessInsert {
  workstep_id: number;
  employee_id: number;
  duration: number;
  amount: number;
  day: string;
  ignore: boolean;
}

export interface Employee {
  id: number;
  name: string;
}

export interface Workstep {
  id: number;
  name: string;
}

export interface WorkprocessInsert {
  workstep_id: number;
  employee_id: number;
  duration: number;
  amount: number;
  day: string;
  ignore: boolean;
}
