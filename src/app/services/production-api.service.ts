import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import {
  Employee,
  Workstep,
  WorkprocessInsert
} from '../models/workprocess';

@Injectable({
  providedIn: 'root'
})
export class ProductionApiService {

  private http = inject(HttpClient);

  private readonly apiUrl = 'http://127.0.0.1:8000';

  getEmployees() {
    return this.http.get<Employee[]>(
      `${this.apiUrl}/employees`
    );
  }

  getWorksteps() {
    return this.http.get<Workstep[]>(
      `${this.apiUrl}/worksteps`
    );
  }

  createWorkprocess(data: WorkprocessInsert) {
    return this.http.post(
      `${this.apiUrl}/workprocesses`,
      data
    );
  }
}
