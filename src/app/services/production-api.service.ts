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


@Injectable({
  providedIn: 'root'
})
export class ProductionApiService {

  private http = inject(HttpClient);

  private readonly apiUrl =
    'http://127.0.0.1:8000';


  getWorksteps() {

    return this.http.get<Workstep[]>(
      `${this.apiUrl}/worksteps`
    );

  }


  createWorkprocess(
    data: WorkprocessInsert
  ) {

    return this.http.post(
      `${this.apiUrl}/workprocesses`,
      data
    );

  }


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
