import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { ProductionApiService } from '../services/production-api.service';
import { PerformanceApiService } from '../services/performance-api.service';

import { Workprocess, Workstep } from '../models/workprocess';
import {
  PerformanceCategory,
  PerformanceRecord
} from '../models/performance-record';

import { formatDuration } from '../shared/utils/duration.util';

@Component({
  selector: 'app-all-data',
  imports: [FormsModule],
  templateUrl: './all-data.html',
  styleUrl: './all-data.css'
})
export class AllDataComponent {
  private productionApi = inject(ProductionApiService);
  private performanceApi = inject(PerformanceApiService);
  private cdr = inject(ChangeDetectorRef);

  workprocesses: Workprocess[] = [];
  performanceRecords: PerformanceRecord[] = [];
  worksteps: Workstep[] = [];

  loading = false;
  errorMessage = '';

  updatingWorkprocessIds = new Set<number>();
  updatingPerformanceRecordIds = new Set<number>();

  /*
   * Grenzwerte für erwartete Fehler
   *
   * Arbeitsprozesse:
   * - Dauer > 3 Stunden
   * - Menge > 40
   *
   * Performance Records:
   * - Menge > 40
   */
  readonly suspiciousDurationMinutes = 3 * 60;
  readonly suspiciousAmount = 40;

  /*
   * Filter Arbeitsprozesse
   *
   * Bewusst zunächst mit getToday().
   * Der Reset setzt das Datum später bewusst auf ''.
   */
  selectedWorkstepId: number | null = null;
  selectedWorkprocessDay = this.getToday();

  /*
   * Filter Performance Records
   */
  selectedCategory: PerformanceCategory | '' = '';
  selectedPerformanceDay = this.getToday();

  /*
   * Ignore-Filter
   */
  workprocessIgnoreFilter: 'all' | 'ignored' | 'active' = 'all';
  performanceIgnoreFilter: 'all' | 'ignored' | 'active' = 'all';

  constructor() {
    this.loadData();
  }

  private getToday(): string {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /*
   * ---------------------------------------------------------
   * Daten laden
   * ---------------------------------------------------------
   */

  private loadData(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      workprocesses: this.productionApi.getWorkprocesses(),
      performanceRecords: this.performanceApi.getPerformanceRecords(),
      worksteps: this.productionApi.getWorksteps()
    })
      .pipe(
        catchError(error => {
          console.error(
            'Fehler beim Laden der Daten:',
            error
          );

          this.errorMessage =
            'Die Daten konnten nicht geladen werden.';

          return of(null);
        }),

        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe(data => {
        if (!data) {
          return;
        }

        this.workprocesses = data.workprocesses;
        this.performanceRecords = data.performanceRecords;
        this.worksteps = data.worksteps;

        this.cdr.detectChanges();
      });
  }

  /*
   * ---------------------------------------------------------
   * Allgemeine Hilfsmethoden
   * ---------------------------------------------------------
   */

  formatDurationValue(minutes: number): string {
    return formatDuration(minutes);
  }

  getWorkstepName(workstepId: number): string {
    return (
      this.worksteps.find(
        workstep => workstep.id === workstepId
      )?.name ?? `#${workstepId}`
    );
  }

  /*
   * ---------------------------------------------------------
   * Erwartete Fehler
   * ---------------------------------------------------------
   *
   * WICHTIG:
   * Hier wird absichtlich NICHT auf workprocess.ignore
   * bzw. record.ignore geprüft.
   *
   * Das bedeutet:
   * Auch ein bereits ignorierter Datensatz wird weiterhin
   * in der Fehler-Tabelle angezeigt.
   */

  /*
   * Arbeitsprozesse:
   *
   * Eine ID darf nur EINMAL vorkommen.
   *
   * Ein Arbeitsprozess ist verdächtig, wenn:
   * - Dauer > 3 Stunden
   * ODER
   * - Menge > 40
   */
 get suspiciousWorkprocesses(): Workprocess[] {
  return this.workprocesses
    .filter(workprocess =>
      !workprocess.ignore &&
      (
        workprocess.duration > this.suspiciousDurationMinutes ||
        workprocess.amount > this.suspiciousAmount
      )
    )
    .sort((a, b) => b.id - a.id);
}

get suspiciousPerformanceRecords(): PerformanceRecord[] {
  return this.performanceRecords
    .filter(record =>
      !record.ignore &&
      record.amount > this.suspiciousAmount
    )
    .sort((a, b) => b.id - a.id);
}

get filteredWorkprocesses(): Workprocess[] {
  return this.workprocesses
    .filter(workprocess => {

      const matchesWorkstep =
        this.selectedWorkstepId === null ||
        workprocess.workstep_id === this.selectedWorkstepId;

      const matchesDay =
        !this.selectedWorkprocessDay ||
        workprocess.day === this.selectedWorkprocessDay;

      const matchesIgnore =
        this.workprocessIgnoreFilter === 'all' ||
        (
          this.workprocessIgnoreFilter === 'ignored' &&
          workprocess.ignore
        ) ||
        (
          this.workprocessIgnoreFilter === 'active' &&
          !workprocess.ignore
        );

      return (
        matchesWorkstep &&
        matchesDay &&
        matchesIgnore
      );
    })
    .sort((a, b) => b.id - a.id);
}

get filteredPerformanceRecords(): PerformanceRecord[] {
  return this.performanceRecords
    .filter(record => {

      const matchesCategory =
        !this.selectedCategory ||
        record.category === this.selectedCategory;

      const matchesDay =
        !this.selectedPerformanceDay ||
        record.day === this.selectedPerformanceDay;

      const matchesIgnore =
        this.performanceIgnoreFilter === 'all' ||
        (
          this.performanceIgnoreFilter === 'ignored' &&
          record.ignore
        ) ||
        (
          this.performanceIgnoreFilter === 'active' &&
          !record.ignore
        );

      return (
        matchesCategory &&
        matchesDay &&
        matchesIgnore
      );
    })
    .sort((a, b) => b.id - a.id);
}

  /*
   * ---------------------------------------------------------
   * Ignore Arbeitsprozess
   * ---------------------------------------------------------
   */

  updateWorkprocessIgnore(
    workprocess: Workprocess,
    event: Event
  ): void {
    const checkbox = event.target as HTMLInputElement;
    const ignore = checkbox.checked;

    if (
      this.updatingWorkprocessIds.has(workprocess.id)
    ) {
      return;
    }

    this.updatingWorkprocessIds.add(workprocess.id);

    this.productionApi
      .updateWorkprocessIgnore(
        workprocess.id,
        ignore
      )
      .pipe(
        catchError(error => {
          console.error(
            'Fehler beim Aktualisieren des Arbeitsprozesses:',
            error
          );

          checkbox.checked = workprocess.ignore;

          this.errorMessage =
            'Der Arbeitsprozess konnte nicht aktualisiert werden.';

          return of(null);
        }),

        finalize(() => {
          this.updatingWorkprocessIds.delete(
            workprocess.id
          );

          this.cdr.detectChanges();
        })
      )
      .subscribe(updatedWorkprocess => {
        if (!updatedWorkprocess) {
          return;
        }

        workprocess.ignore =
          updatedWorkprocess.ignore;

        this.cdr.detectChanges();
      });
  }

  /*
   * ---------------------------------------------------------
   * Ignore Performance Record
   * ---------------------------------------------------------
   */

  updatePerformanceRecordIgnore(
    record: PerformanceRecord,
    event: Event
  ): void {
    const checkbox = event.target as HTMLInputElement;
    const ignore = checkbox.checked;

    if (
      this.updatingPerformanceRecordIds.has(record.id)
    ) {
      return;
    }

    this.updatingPerformanceRecordIds.add(record.id);

    this.performanceApi
      .updatePerformanceRecordIgnore(
        record.id,
        ignore
      )
      .pipe(
        catchError(error => {
          console.error(
            'Fehler beim Aktualisieren des Performance Records:',
            error
          );

          checkbox.checked = record.ignore;

          this.errorMessage =
            'Der Performance Record konnte nicht aktualisiert werden.';

          return of(null);
        }),

        finalize(() => {
          this.updatingPerformanceRecordIds.delete(
            record.id
          );

          this.cdr.detectChanges();
        })
      )
      .subscribe(updatedRecord => {
        if (!updatedRecord) {
          return;
        }

        record.ignore =
          updatedRecord.ignore;

        this.cdr.detectChanges();
      });
  }

  /*
   * ---------------------------------------------------------
   * Update-Status
   * ---------------------------------------------------------
   */

  isUpdatingWorkprocess(id: number): boolean {
    return this.updatingWorkprocessIds.has(id);
  }

  isUpdatingPerformanceRecord(id: number): boolean {
    return this.updatingPerformanceRecordIds.has(id);
  }

  /*
   * ---------------------------------------------------------
   * Filter zurücksetzen
   * ---------------------------------------------------------
   *
   * Absichtlich KEIN getToday().
   *
   * Nach "Filter zurücksetzen" soll das Datum leer sein,
   * damit alle Tage angezeigt werden.
   */

  resetWorkprocessFilters(): void {
    this.selectedWorkstepId = null;
    this.selectedWorkprocessDay = '';
    this.workprocessIgnoreFilter = 'all';
  }

  resetPerformanceFilters(): void {
    this.selectedCategory = '';
    this.selectedPerformanceDay = '';
    this.performanceIgnoreFilter = 'all';
  }
}
