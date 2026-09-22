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
 * Available evaluation periods.
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


  /** Current evaluation result. */
  evaluation: Evaluation | null = null;

  /** Indicates whether an evaluation request is active. */
  loading = false;

  /** Current error message. */
  errorMessage = '';

  /** Indicates whether a custom range has been requested. */
  customRangeRequested = false;

  /** Currently selected evaluation mode. */
  currentMode: EvaluationMode = 'week';

  /** Date used as reference for day, week and year evaluations. */
  private readonly today = new Date();


  /**
   * Evaluation filter form.
   *
   * selectedMonth uses the JavaScript month index (0-11).
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


  /** Years available for month selection. */
  availableYears: number[] = [];


  /** Aggregated values for the currently displayed period. */
  selectedPeriod: EvaluationPeriod = {
    production: 0,
    sale: 0,
    difference: 0
  };


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


  /** Returns the currently selected month. */
  get selectedMonth(): number {

    return this.customForm.controls.selectedMonth.value;

  }


  /** Returns the currently selected month year. */
  get selectedMonthYear(): number {

    return this.customForm.controls.selectedMonthYear.value;

  }


  /**
   * Changes the active evaluation mode.
   *
   * @param mode Evaluation mode to activate.
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


  /** Reloads the evaluation after the selected date changes. */
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


  /** Reloads the evaluation after the selected month changes. */
  onMonthChange(): void {

    this.errorMessage = '';
    this.loadMonth();
  }


  /** Reloads the evaluation after the selected month year changes. */
  onMonthYearChange(): void {

    this.errorMessage = '';
    this.loadMonth();
  }


  /** Synchronizes the month controls with the selected date. */
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


  /** Loads the evaluation for the selected day. */
  private loadDay(): void {

    const selectedDate =
      this.customForm.controls.selectedDate.value;

    this.requestEvaluation(
      selectedDate,
      selectedDate
    );
  }


  /** Loads the evaluation for the week containing the selected date. */
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


  /** Loads the evaluation for the selected month. */
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


  /** Loads the evaluation for the year of the selected date. */
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
   * Loads the evaluation for a custom date range.
   *
   * @returns void
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
   * Requests an evaluation from the API.
   *
   * @param from Start date in YYYY-MM-DD format.
   * @param to End date in YYYY-MM-DD format.
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


  /** Calculates aggregated production, sales and difference values. */
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

  /** Returns the display title for the active evaluation mode. */
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
