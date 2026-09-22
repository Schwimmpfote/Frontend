/**
 * Defines the data required to record a work process performed
 * without assigning it to a specific employee.
 */
export interface WorkprocessInsert {
  workstep_id: number;
  employee_id: null;
  duration: number;
  amount: number;
  day: string;
  ignore: boolean;
}


/**
 * Represents a production work step that can be selected
 * when recording or evaluating work processes.
 */
export interface Workstep {
  id: number;
  name: string;
}


/**
 * Defines the data required to record a work process performed
 * without assigning it to a specific employee.
 */
export interface WorkprocessInsert {
  workstep_id: number;
  employee_id: null;
  duration: number;
  amount: number;
  day: string;
  ignore: boolean;
}
