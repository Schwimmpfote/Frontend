import {
  Injectable,
  inject
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Evaluation
} from '../models/evaluation';

import {
  Workstep,
  WorkprocessInsert
} from '../models/workprocess';


/**
 * Provides the HTTP interface for production-related backend operations.
 * It centralizes requests for work steps, work processes and evaluations.
 */
@Injectable({
  providedIn: 'root'
})
export class ProductionApiService {

  private http = inject(HttpClient);

  /**
   * Base URL used by all production API requests.
   * Keeping the address in one place avoids repeating it across endpoints.
   */
  private readonly apiUrl =
    'http://127.0.0.1:8000';


  /**
   * Retrieves all work steps available for production recording.
   *
   * @returns Observable containing the available work steps.
   */
  getWorksteps() {

    return this.http.get<Workstep[]>(
      `${this.apiUrl}/worksteps`
    );

  }


  /**
   * Sends a new work process to the backend for persistence.
   *
   * @param data Work process data submitted by the production form.
   * @returns Observable containing the backend response.
   */
  createWorkprocess(
    data: WorkprocessInsert
  ) {

    return this.http.post(
      `${this.apiUrl}/workprocesses`,
      data
    );

  }


  /**
   * Retrieves evaluation data for a requested date range.
   * An optional work-step filter can restrict the returned evaluation
   * to a specific production step.
   *
   * @param from Inclusive start date of the evaluation range.
   * @param to Inclusive end date of the evaluation range.
   * @param workstepId Optional identifier used to filter by work step.
   * @returns Observable containing the calculated evaluation.
   */
  getEvaluation(
    from: string,
    to: string,
    workstepId?: number
  ) {

    let params: any = {
      from,
      to
    };

    if (workstepId !== undefined) {

      params.workstep_id =
        workstepId;

    }

    return this.http.get<Evaluation>(
      `${this.apiUrl}/evaluation`,
      {
        params
      }
    );

  }

}
