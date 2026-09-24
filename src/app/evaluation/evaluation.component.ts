import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { ProductionApiService } from '../services/production-api.service';
import { Evaluation, EvaluationDay, EvaluationPeriod } from '../models/evaluation';
import { getToday, parseDate } from '../shared/utils/date.util';

/**
 * Defines the available evaluation modes.
 */
type EvaluationMode = 'day' | 'week' | 'month' | 'year' | 'custom';

@Component({
  selector: 'app-evaluation',
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './evaluation.html',
  styleUrl: './evaluation.css'
})
export class EvaluationComponent {
  private fb = inject(FormBuilder);
  private api = inject(ProductionApiService);
  private cdr = inject(ChangeDetectorRef);

  private readonly today = new Date();

  evaluation: Evaluation | null = null;

  loading = false;

  errorMessage = '';

  customRangeRequested = false;

  currentMode: EvaluationMode = 'week';

  /**
   * Form containing the date and period selection values used by the evaluation view.
   */
  customForm = this.fb.nonNullable.group({
    from: [getToday(), Validators.required],
    to: [getToday(), Validators.required],
    selectedDate: [getToday(), Validators.required],
    selectedMonth: [this.today.getMonth(), Validators.required],
    selectedMonthYear: [this.today.getFullYear(), Validators.required],
    selectedYear: [this.today.getFullYear(), Validators.required]
  });

  /**
   * Provides a list of years ranging from ten years in the past
   * to ten years in the future.
   */
  availableYears = Array.from(
    { length: 21 },
    (_, i) => this.today.getFullYear() - 10 + i
  );

  /**
   * Contains the calculated totals for the currently selected evaluation period.
   */
  selectedPeriod: EvaluationPeriod = {
    production: 0,
    sale: 0,
    difference: 0
  };

  /**
   * Initializes the component and loads the default weekly evaluation.
   */
  constructor() {
    this.load('week');
  }

  /**
   * Returns the currently selected month.
   */
  get selectedMonth() {
    return this.customForm.controls.selectedMonth.value;
  }

  /**
   * Returns the currently selected month year.
   */
  get selectedMonthYear() {
    return this.customForm.controls.selectedMonthYear.value;
  }

  /**
   * Returns the translated title for the currently selected evaluation mode.
   */
  get modeTitle(): string {
    return {
      day: 'Tagesbilanz',
      week: 'Wochenbilanz',
      month: 'Monatsbilanz',
      year: 'Jahresbilanz',
      custom: 'Benutzerdefinierter Zeitraum'
    }[this.currentMode];
  }

  /**
   * Changes the current evaluation mode and loads the corresponding data.
   *
   * @param mode The evaluation mode to select.
   */
  selectMode(mode: EvaluationMode): void {
    this.currentMode = mode;
    this.errorMessage = '';
    this.customRangeRequested = false;

    if (mode === 'custom') {
      this.clearEvaluation();
      return;
    }

    this.load(mode);
  }

  /**
   * Handles changes to the selected date and updates related date fields.
   */
  onDateChange(): void {
    this.errorMessage = '';
    const date = this.customForm.controls.selectedDate.value;
    const selected = parseDate(date);

    this.customForm.patchValue({
      selectedMonth: selected.getMonth(),
      selectedMonthYear: selected.getFullYear(),
      selectedYear: selected.getFullYear()
    });

    this.load(this.currentMode, selected);
  }

  /**
   * Handles changes to the selected month.
   */
  onMonthChange(): void {
    this.loadMonth();
  }

  /**
   * Handles changes to the selected month year.
   */
  onMonthYearChange(): void {
    this.loadMonth();
  }

  /**
   * Handles changes to the selected year and loads the corresponding yearly evaluation.
   */
  onYearChange(): void {
    this.errorMessage = '';

    const year = this.customForm.controls.selectedYear.value;
    const date = parseDate(this.customForm.controls.selectedDate.value);

    this.setSelectedDate(year, date.getMonth(), date.getDate());
    this.load('year');
  }

  /**
   * Validates the custom date range and loads the corresponding evaluation.
   */
  loadCustomRange(): void {
    this.clearEvaluation();
    this.errorMessage = '';

    if (this.customForm.invalid) {
      this.customForm.markAllAsTouched();
      this.errorMessage = 'Bitte geben Sie einen gültigen Zeitraum ein.';
      this.cdr.detectChanges();
      return;
    }

    const { from, to } = this.customForm.getRawValue();

    if (from > to) {
      this.errorMessage = 'Das Startdatum darf nicht nach dem Enddatum liegen.';
      this.cdr.detectChanges();
      return;
    }

    this.currentMode = 'custom';
    this.customRangeRequested = true;
    this.request(this.api.getCustomRange(from, to));
  }

  /**
   * Loads an evaluation for the specified mode and date.
   *
   * @param mode The evaluation mode to load.
   * @param date The date used as the reference point for the evaluation.
   */
  private load(
    mode: EvaluationMode,
    date = parseDate(this.customForm.controls.selectedDate.value)
  ): void {
    const value = this.customForm.controls.selectedDate.value;

    switch (mode) {
      case 'day':
        this.request(this.api.getDay(value));
        break;

      case 'week':
        this.request(this.api.getWeek(value));
        break;

      case 'month':
        this.setMonthFromDate(date);
        this.request(this.api.getMonth(date.getFullYear(), date.getMonth()));
        break;

      case 'year':
        this.customForm.controls.selectedYear.setValue(date.getFullYear());
        this.request(this.api.getYear(date.getFullYear()));
        break;
    }
  }

  /**
   * Loads the evaluation for the currently selected month and year.
   */
  private loadMonth(): void {
    this.errorMessage = '';

    const month = this.selectedMonth;
    const year = this.selectedMonthYear;
    const date = parseDate(this.customForm.controls.selectedDate.value);

    this.setSelectedDate(year, month, date.getDate());
    this.request(this.api.getMonth(year, month));
  }

  /**
   * Updates the selected date while ensuring that the day is valid for the given month.
   *
   * @param year The year of the new date.
   * @param month The zero-based month index.
   * @param day The preferred day of the month.
   */
  private setSelectedDate(year: number, month: number, day: number): void {
    const validDay = Math.min(
      day,
      new Date(year, month + 1, 0).getDate()
    );

    const date = new Date(year, month, validDay);

    this.customForm.patchValue({
      selectedDate: [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0')
      ].join('-'),
      selectedYear: year
    });
  }

  /**
   * Updates the selected month and year based on the provided date.
   *
   * @param date The date from which the month and year are taken.
   */
  private setMonthFromDate(date: Date): void {
    this.customForm.patchValue({
      selectedMonth: date.getMonth(),
      selectedMonthYear: date.getFullYear()
    });
  }

  /**
   * Clears the currently loaded evaluation and resets the period totals.
   */
  private clearEvaluation(): void {
    this.evaluation = null;
    this.selectedPeriod = {
      production: 0,
      sale: 0,
      difference: 0
    };
  }

  /**
   * Executes an evaluation request and handles loading, errors and the response.
   * Empty evaluation days are removed before the result is stored.
   *
   * @param request$ Observable containing the evaluation request.
   */
  private request(request$: Observable<Evaluation>): void {
    this.loading = true;
    this.errorMessage = '';
    this.evaluation = null;

    request$
      .pipe(
        catchError(error => {
          console.error('Fehler beim Laden der Auswertung:', error);
          this.errorMessage = 'Die Auswertung konnte nicht geladen werden.';
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe(evaluation => {
        if (!evaluation) return;

        const daily = evaluation.daily.filter(
          day => day.production > 0 || day.sale > 0
        );

        this.evaluation = { ...evaluation, daily };
        this.selectedPeriod = this.calculatePeriod(daily);
        this.cdr.detectChanges();
      });
  }

  /**
   * Calculates the total production, sales and difference for a collection of days.
   *
   * @param days Evaluation data for the individual days.
   * @returns The calculated totals for the selected period.
   */
  private calculatePeriod(days: EvaluationDay[]): EvaluationPeriod {
    const production = days.reduce((sum, day) => sum + day.production, 0);
    const sale = days.reduce((sum, day) => sum + day.sale, 0);

    return {
      production,
      sale,
      difference: production - sale
    };
  }
}
