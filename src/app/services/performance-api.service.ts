import {
  Injectable,
  inject
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  PerformanceRecordInsert
} from '../models/performance-record';


/**
 * Provides HTTP operations for persisting performance records.
 * The service is registered application-wide so that components can
 * reuse the same API access layer.
 */
@Injectable({
  providedIn: 'root'
})
export class PerformanceApiService {

  private http = inject(HttpClient);

  /**
   * Base address of the backend used for performance-related requests.
   * The endpoint can be replaced centrally when the backend environment changes.
   */
  private readonly apiUrl = 'http://127.0.0.1:8000';


  /**
   * Persists a new performance record in the backend.
   *
   * @param data Validated performance data that should be stored.
   * @returns Observable containing the HTTP response from the backend.
   */
  createPerformanceRecord(data: PerformanceRecordInsert) {
    return this.http.post(
      `${this.apiUrl}/performance_record`,
      data
    );
  }
}
