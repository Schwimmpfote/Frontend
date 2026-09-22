import {
  ChangeDetectorRef,
  Component,
  inject
} from '@angular/core';

import {
  DecimalPipe
} from '@angular/common';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  of
} from 'rxjs';

import {
  catchError,
  finalize
} from 'rxjs/operators';

import {
  ProductionApiService
} from '../services/production-api.service';

import {
  Evaluation,
  EvaluationDay,
  EvaluationPeriod
} from '../models/evaluation';

import {
  formatDate,
  getToday,
  parseDate
} from '../shared/utils/date.util';


/**
 * Defines the supported time scopes for which production data can be evaluated.
 * The custom mode uses an independently selected start and end date.
 */
type EvaluationMode =
  | 'day'
  | 'week'
  | 'month'
  | 'year'
  | 'custom';


@Component({
  selector: 'app-evaluation',
  imports: [
    ReactiveFormsModule,
    DecimalPipe
  ],
  templateUrl: './evaluation.html',
  styleUrl: './evaluation.css'
})
export class EvaluationComponent {

  private fb = inject(FormBuilder);
  private api = inject(ProductionApiService);
  private cdr = inject(ChangeDetectorRef);

  evaluation: Evaluation | null = null;
  loading = false;
  errorMessage = '';
  customRangeRequested = false;
  currentMode: EvaluationMode = 'week';
  
  private readonly today = new Date();

  /**
   * Contains the date and period controls used to build evaluation requests.
   *
   * The month control follows JavaScript's zero-based month representation,
   * where January is 0 and December is 11.
   */
  customForm = this.fb.nonNullable.group({

    from: [
      getToday(),
      Validators.required
    ],

    to: [
      getToday(),
      Validators.required
    ],

    selectedDate: [
      getToday(),
      Validators.required
    ],

    selectedMonth: [
      this.today.getMonth(),
      Validators.required
    ],

    selectedMonthYear: [
      this.today.getFullYear(),
      Validators.required
    ]

  });

  /**
   * Provides the range of years that can currently be selected in the month view.
   */
  availableYears: number[] = [];

  /**
   * Holds the aggregated production and sales values for the active period.
   * The difference represents production minus sales.
   */
  selectedPeriod: EvaluationPeriod = {
    production: 0,
    sale: 0,
    difference: 0
  };

  /**
   * Initializes the selectable year range and loads the default weekly evaluation.
   */
  constructor() {

    const currentYear =
      this.today.getFullYear();

    this.availableYears =
      Array.from(
        { length: 21 },
        (_, index) =>
          currentYear - 10 + index
      );

    this.loadWeek();
  }

  /**
   * Exposes the selected month so it can be consumed without accessing the form structure directly.
   */
  get selectedMonth(): number {

    return this.customForm.controls.selectedMonth.value;

  }

  /**
   * Exposes the year associated with the currently selected month.
   */
  get selectedMonthYear(): number {

    return this.customForm.controls.selectedMonthYear.value;

  }

  /**
   * Activates an evaluation mode and loads the corresponding data.
   *
   * Switching to custom mode clears the current result because
   * the custom range must be explicitly submitted before new data is requested.
   *
   * @param mode Evaluation mode selected by the user.
   */
  selectMode(
    mode: EvaluationMode
  ): void {

    this.currentMode = mode;
    this.errorMessage = '';

    if (mode === 'custom') {

      this.evaluation = null;
      this.customRangeRequested = false;

      this.selectedPeriod = {
        production: 0,
        sale: 0,
        difference: 0
      };

      return;
    }

    this.customRangeRequested = false;

    switch (mode) {

      case 'day':
        this.loadDay();
        break;

      case 'week':
        this.loadWeek();
        break;

      case 'month':
        this.syncMonthFromDate();
        this.loadMonth();
        break;

      case 'year':
        this.loadYear();
        break;
    }
  }

  /**
   * Refreshes the active evaluation after a date-based form value changes.
   * The request boundaries are recalculated according to the selected mode.
   */
  onDateChange(): void {

    this.errorMessage = '';

    switch (this.currentMode) {

      case 'day':
        this.loadDay();
        break;

      case 'week':
        this.loadWeek();
        break;

      case 'month':
        this.syncMonthFromDate();
        this.loadMonth();
        break;

      case 'year':
        this.loadYear();
        break;
    }
  }

  /**
   * Requests fresh data after the selected month has changed.
   */
  onMonthChange(): void {

    this.errorMessage = '';
    this.loadMonth();
  }

  /**
   * Requests fresh data after the year associated with the selected month has changed.
   */
  onMonthYearChange(): void {

    this.errorMessage = '';
    this.loadMonth();
  }

  /**
   * Keeps the month and year selectors synchronized with the selected calendar date.
   * Invalid date values are ignored to prevent invalid API requests.
   */
  private syncMonthFromDate(): void {

    const value =
      this.customForm.controls.selectedDate.value;

    if (!value) {
      return;
    }

    const date =
      parseDate(value);

    if (Number.isNaN(date.getTime())) {
      return;
    }

    this.customForm.controls.selectedMonth.setValue(
      date.getMonth()
    );

    this.customForm.controls.selectedMonthYear.setValue(
      date.getFullYear()
    );
  }

  /**
   * Builds a one-day request using the currently selected date as both boundaries.
   */
  private loadDay(): void {

    const selectedDate =
      this.customForm.controls.selectedDate.value;

    this.requestEvaluation(
      selectedDate,
      selectedDate
    );
  }

  /**
   * Determines the Monday-to-Sunday interval containing the selected date.
   * Sunday is treated as the final day of the preceding Monday-based week.
   */
  private loadWeek(): void {

    const selectedDate =
      this.customForm.controls.selectedDate.value;

    const selected =
      parseDate(selectedDate);

    const day =
      selected.getDay();

    const difference =
      day === 0
        ? -6
        : 1 - day;

    const monday =
      new Date(selected);

    monday.setDate(
      selected.getDate() + difference
    );

    const sunday =
      new Date(monday);

    sunday.setDate(
      monday.getDate() + 6
    );

    this.requestEvaluation(
      formatDate(monday),
      formatDate(sunday)
    );
  }

  /**
   * Creates the first and last calendar day of the selected month
   * and uses them as the evaluation boundaries.
   */
  private loadMonth(): void {

    const month =
      this.customForm.controls.selectedMonth.value;

    const year =
      this.customForm.controls.selectedMonthYear.value;

    const firstDay =
      new Date(year, month, 1);

    const lastDay =
      new Date(year, month + 1, 0);

    this.requestEvaluation(
      formatDate(firstDay),
      formatDate(lastDay)
    );
  }

  /**
   * Creates a complete calendar-year interval based on the selected date.
   */
  private loadYear(): void {

    const selectedDate =
      this.customForm.controls.selectedDate.value;

    const selected =
      parseDate(selectedDate);

    const year =
      selected.getFullYear();

    const firstDay =
      new Date(year, 0, 1);

    const lastDay =
      new Date(year, 11, 31);

    this.requestEvaluation(
      formatDate(firstDay),
      formatDate(lastDay)
    );
  }

  /**
   * Validates and submits the manually selected date interval.
   * Invalid form values or reversed boundaries prevent an API request.
   */
  loadCustomRange(): void {

    if (this.customForm.invalid) {

      this.customForm.markAllAsTouched();
      return;
    }

    const {
      from,
      to
    } = this.customForm.getRawValue();

    if (from > to) {

      this.errorMessage =
        'Das Startdatum darf nicht nach dem Enddatum liegen.';

      return;
    }

    this.errorMessage = '';
    this.customRangeRequested = true;
    this.currentMode = 'custom';

    this.requestEvaluation(
      from,
      to
    );
  }

  /**
   * Retrieves evaluation data for the specified date boundaries and updates the view state.
   * Days without production or sales are removed before aggregate values are calculated.
   *
   * @param from Inclusive start date in YYYY-MM-DD format.
   * @param to Inclusive end date in YYYY-MM-DD format.
   */
  private requestEvaluation(
    from: string,
    to: string
  ): void {

    this.loading = true;
    this.errorMessage = '';
    this.evaluation = null;

    this.api
      .getEvaluation(from, to)
      .pipe(

        catchError(error => {

          console.error(
            'Fehler beim Laden der Auswertung:',
            error
          );

          this.errorMessage =
            'Die Auswertung konnte nicht geladen werden.';

          return of(null);
        }),

        finalize(() => {

          this.loading = false;
          this.cdr.detectChanges();
        })

      )
      .subscribe(evaluation => {

        if (!evaluation) {
          return;
        }

        const filteredEvaluation: Evaluation = {
          ...evaluation,
          daily:
            evaluation.daily.filter(
              day =>
                day.production > 0 ||
                day.sale > 0
            )
        };

        this.evaluation = filteredEvaluation;

        this.selectedPeriod =
          this.calculatePeriod(
            filteredEvaluation.daily
          );

        this.cdr.detectChanges();
      });
  }

  /**
   * Aggregates production and sales across all supplied daily evaluation entries.
   * The resulting difference is calculated from the two aggregated values.
   *
   * @param days Daily evaluation entries belonging to the active period.
   * @returns Aggregated production, sales and production-minus-sales values.
   */
  private calculatePeriod(
    days: EvaluationDay[]
  ): EvaluationPeriod {

    const production =
      days.reduce(
        (sum, day) =>
          sum + day.production,
        0
      );

    const sale =
      days.reduce(
        (sum, day) =>
          sum + day.sale,
        0
      );

    return {
      production,
      sale,
      difference: production - sale
    };
  }

  /**
   * Returns the localized title associated with the currently active evaluation mode.
   */
  get modeTitle(): string {

    switch (this.currentMode) {

      case 'day':
        return 'Tagesbilanz';

      case 'week':
        return 'Wochenbilanz';

      case 'month':
        return 'Monatsbilanz';

      case 'year':
        return 'Jahresbilanz';

      case 'custom':
        return 'Benutzerdefinierter Zeitraum';
    }
  }

}
