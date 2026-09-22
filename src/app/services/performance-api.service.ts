import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import {
  PerformanceRecordInsert
} from '../models/performance-record';

@Injectable({
  providedIn: 'root'
})
export class PerformanceApiService {

  private http = inject(HttpClient);

  private readonly apiUrl = 'http://127.0.0.1:8000';

  createPerformanceRecord(data: PerformanceRecordInsert) {
    return this.http.post(
      `${this.apiUrl}/performance_record`,
      data
    );
  }
}
