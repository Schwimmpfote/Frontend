import { Injectable, inject } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Evaluation } from '../models/evaluation';

import {
  Workprocess,
  WorkprocessInsert,
  Workstep
} from '../models/workprocess';

import { formatDate, parseDate } from '../shared/utils/date.util';




/**
 * Provides the HTTP interface for production-related backend operations.
 * It centralizes requests for work steps, work processes and evaluations.
 */
@Injectable({
  providedIn: 'root',
})
export class ProductionApiService {
  private http = inject(HttpClient);

  /**
   * Base URL used by all production API requests.
   * Keeping the address in one place avoids repeating it across endpoints.
   */
  private readonly apiUrl = 'http://127.0.0.1:8000';

  /**
   * Retrieves all work steps available for production recording.
   *
   * @returns Observable containing the available work steps.
   */
  getWorksteps() {
    return this.http.get<Workstep[]>(`${this.apiUrl}/worksteps`);
  }

  /**
   * Sends a new work process to the backend for persistence.
   *
   * @param data Work process data submitted by the production form.
   * @returns Observable containing the backend response.
   */
  createWorkprocess(data: WorkprocessInsert) {
    return this.http.post(`${this.apiUrl}/workprocesses`, data);
  }

  getDay(date: string, workstepId?: number) {
    const params: any = {
      from: date,
      to: date,
    };

    if (workstepId !== undefined) {
      params.workstep_id = workstepId;
    }

    return this.http.get<Evaluation>(`${this.apiUrl}/evaluation`, { params });
  }

  getWeek(date: string, workstepId?: number) {
    const selected = parseDate(date);

    const day = selected.getDay();

    const difference = day === 0 ? -6 : 1 - day;

    const monday = new Date(selected);

    monday.setDate(selected.getDate() + difference);

    const sunday = new Date(monday);

    sunday.setDate(monday.getDate() + 6);

    const params: any = {
      from: formatDate(monday),
      to: formatDate(sunday),
    };

    if (workstepId !== undefined) {
      params.workstep_id = workstepId;
    }

    return this.http.get<Evaluation>(`${this.apiUrl}/evaluation`, { params });
  }

  getMonth(year: number, month: number, workstepId?: number) {
    const firstDay = new Date(year, month, 1);

    const lastDay = new Date(year, month + 1, 0);

    const params: any = {
      from: formatDate(firstDay),
      to: formatDate(lastDay),
    };

    if (workstepId !== undefined) {
      params.workstep_id = workstepId;
    }

    return this.http.get<Evaluation>(`${this.apiUrl}/evaluation`, { params });
  }

  getYear(year: number, workstepId?: number) {
    const firstDay = new Date(year, 0, 1);

    const lastDay = new Date(year, 11, 31);

    const params: any = {
      from: formatDate(firstDay),
      to: formatDate(lastDay),
    };

    if (workstepId !== undefined) {
      params.workstep_id = workstepId;
    }

    return this.http.get<Evaluation>(`${this.apiUrl}/evaluation`, { params });
  }

  getCustomRange(from: string, to: string, workstepId?: number) {
    const params: any = {
      from,
      to,
    };

    if (workstepId !== undefined) {
      params.workstep_id = workstepId;
    }

    return this.http.get<Evaluation>(`${this.apiUrl}/evaluation`, { params });
  }
  getWorkprocesses() {
  return this.http.get<Workprocess[]>(
    `${this.apiUrl}/workprocesses`
  );
}

updateWorkprocessIgnore(id: number, ignore: boolean) {
  return this.http.patch<Workprocess>(
    `${this.apiUrl}/workprocesses`,
    { ignore },
    {
      params: {
        id
      }
    }
  );
}

}


//statt eval getyear, getmonth,etc
