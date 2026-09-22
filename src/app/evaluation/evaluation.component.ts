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

  private api = inject(
    ProductionApiService
  );

  private cdr = inject(
    ChangeDetectorRef
  );


  /*
   * ========================================
   * Zustand
   * ========================================
   */

  evaluation: Evaluation | null = null;

    loading = false;

    errorMessage = '';

    customRangeRequested = false;



  /*
   * Standardansicht.
   */
  currentMode: EvaluationMode = 'week';


  /*
   * ========================================
   * Aktuelles Datum
   * ========================================
   *
   * Wichtig:
   *
   * selectedDate bleibt immer das tatsächlich
   * ausgewählte Datum.
   *
   * Wir benutzen es NICHT für die
   * Monatsauswahl.
   */

  private readonly today =
    new Date();


  /*
   * ========================================
   * Formular
   * ========================================
   */

  customForm = this.fb.nonNullable.group({

    /*
     * Von / Bis für benutzerdefinierten
     * Zeitraum.
     */
    from: [
      this.getToday(),
      Validators.required
    ],

    to: [
      this.getToday(),
      Validators.required
    ],


    /*
     * Datum für Tag und Woche.
     *
     * Bleibt auf dem heutigen Datum.
     */
    selectedDate: [
      this.getToday(),
      Validators.required
    ],


    /*
     * Monat für die Monatsauswertung.
     *
     * Januar = 0
     * Februar = 1
     * ...
     * Dezember = 11
     */
    selectedMonth: [
      this.today.getMonth(),
      Validators.required
    ],


    /*
     * Jahr für die Monatsauswertung.
     */
    selectedMonthYear: [
      this.today.getFullYear(),
      Validators.required
    ]

  });


  /*
   * ========================================
   * Verfügbare Jahre
   * ========================================
   */

  availableYears: number[] = [];


  /*
   * ========================================
   * Periodenwerte
   * ========================================
   */

  selectedPeriod: EvaluationPeriod = {

    production: 0,

    sale: 0,

    difference: 0

  };


  /*
   * ========================================
   * Konstruktor
   * ========================================
   */

  constructor() {

    const currentYear =
      this.today.getFullYear();


    /*
     * 10 Jahre zurück
     * bis 10 Jahre in die Zukunft.
     */
    this.availableYears =
      Array.from(
        { length: 21 },
        (_, index) =>
          currentYear - 10 + index
      );


    /*
     * WICHTIG:
     *
     * selectedDate wird hier NICHT verändert.
     *
     * Dadurch bleibt bei Tag/Woche:
     *
     * z.B. 22.09.2026
     *
     * und nicht:
     *
     * 01.09.2026
     */


    /*
     * Standardansicht:
     * aktuelle Woche laden.
     */
    this.loadWeek();

  }


  /*
   * ========================================
   * Aktuell ausgewählter Monat
   * ========================================
   */

  get selectedMonth(): number {

    return this.customForm.controls.selectedMonth.value;

  }


  /*
   * ========================================
   * Aktuell ausgewähltes Monatsjahr
   * ========================================
   */

  get selectedMonthYear(): number {

    return this.customForm.controls.selectedMonthYear.value;

  }


  /*
   * ========================================
   * Ansicht wechseln
   * ========================================
   */

selectMode(
  mode: EvaluationMode
): void {

  this.currentMode = mode;

  this.errorMessage = '';

  /*
   * ======================================
   * BENUTZERDEFINIERTER ZEITRAUM
   * ======================================
   *
   * Es gibt keinen Standardzeitraum.
   *
   * Deshalb:
   * - alte Auswertung entfernen
   * - keine API-Anfrage
   * - Info-Nachricht anzeigen
   */

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


  /*
   * Bei allen anderen Ansichten
   * ist die alte Custom-Anzeige
   * nicht mehr relevant.
   */

  this.customRangeRequested = false;


  switch (mode) {

    case 'day':

      this.loadDay();

      break;


    case 'week':

      this.loadWeek();

      break;


    case 'month': {

      const now = new Date();

      this.customForm.controls.selectedMonth.setValue(
        now.getMonth()
      );

      this.customForm.controls.selectedMonthYear.setValue(
        now.getFullYear()
      );

      this.loadMonth();

      break;
    }


    case 'year':

      this.loadYear();

      break;

  }

}




  /*
   * ========================================
   * Datum geändert
   * ========================================
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

        /*
         * Sollte selectedDate einmal
         * für die Monatsansicht geändert
         * werden, übernehmen wir Monat/Jahr.
         */
        this.syncMonthFromDate();

        this.loadMonth();

        break;


      case 'year':

        this.loadYear();

        break;

    }

  }


  /*
   * ========================================
   * Monat geändert
   * ========================================
   */

  onMonthChange(): void {

    this.errorMessage = '';


    /*
     * Der FormControl-Wert wird bereits
     * automatisch aktualisiert.
     *
     * Deshalb müssen wir hier nichts
     * manuell aus event.target.value
     * auslesen.
     */

    this.loadMonth();

  }


  /*
   * ========================================
   * Jahr für Monatsansicht geändert
   * ========================================
   */

  onMonthYearChange(): void {

    this.errorMessage = '';


    /*
     * Auch hier wird der FormControl-Wert
     * automatisch aktualisiert.
     */

    this.loadMonth();

  }


  /*
   * ========================================
   * Monat/Jahr aus selectedDate übernehmen
   * ========================================
   */

  private syncMonthFromDate(): void {

    const value =
      this.customForm.controls.selectedDate.value;


    if (!value) {

      return;

    }


    const date =
      this.parseDate(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return;

    }


    this.customForm.controls.selectedMonth.setValue(
      date.getMonth()
    );


    this.customForm.controls.selectedMonthYear.setValue(
      date.getFullYear()
    );

  }


  /*
   * ========================================
   * Tag
   * ========================================
   */

  private loadDay(): void {

    const selectedDate =
      this.customForm.controls.selectedDate.value;


    this.requestEvaluation(
      selectedDate,
      selectedDate
    );

  }


  /*
   * ========================================
   * Woche
   * ========================================
   */

  private loadWeek(): void {

    const selectedDate =
      this.customForm.controls.selectedDate.value;


    const selected =
      this.parseDate(
        selectedDate
      );


    const day =
      selected.getDay();


    /*
     * Montag = 1
     * Sonntag = 0
     */
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
      this.formatDate(monday),
      this.formatDate(sunday)
    );

  }


  /*
   * ========================================
   * Monat
   * ========================================
   */

  private loadMonth(): void {

    const month =
      this.customForm.controls.selectedMonth.value;


    const year =
      this.customForm.controls.selectedMonthYear.value;


    /*
     * Erster Tag des Monats.
     */
    const firstDay =
      new Date(
        year,
        month,
        1
      );


    /*
     * Letzter Tag des Monats.
     */
    const lastDay =
      new Date(
        year,
        month + 1,
        0
      );


    this.requestEvaluation(
      this.formatDate(firstDay),
      this.formatDate(lastDay)
    );

  }


  /*
   * ========================================
   * Jahr
   * ========================================
   */

  private loadYear(): void {

    const selectedDate =
      this.customForm.controls.selectedDate.value;


    const selected =
      this.parseDate(
        selectedDate
      );


    const year =
      selected.getFullYear();


    const firstDay =
      new Date(
        year,
        0,
        1
      );


    const lastDay =
      new Date(
        year,
        11,
        31
      );


    this.requestEvaluation(
      this.formatDate(firstDay),
      this.formatDate(lastDay)
    );

  }


  /*
   * ========================================
   * Benutzerdefinierter Zeitraum
   * ========================================
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


  /*
   * ========================================
   * API Request
   * ========================================
   */

  private requestEvaluation(
    from: string,
    to: string
  ): void {

    this.loading = true;

    this.errorMessage = '';


    /*
     * Alte Daten entfernen.
     */
    this.evaluation = null;


    this.api
      .getEvaluation(
        from,
        to
      )
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


        /*
         * Nur Tage mit tatsächlichen
         * Produktions- oder Verkaufswerten.
         */
        const filteredEvaluation: Evaluation = {

          ...evaluation,

          daily:
            evaluation.daily.filter(
              day =>
                day.production > 0 ||
                day.sale > 0
            )

        };


        this.evaluation =
          filteredEvaluation;


        this.selectedPeriod =
          this.calculatePeriod(
            filteredEvaluation.daily
          );


        this.cdr.detectChanges();

      });

  }


  /*
   * ========================================
   * Bilanz berechnen
   * ========================================
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

      difference:
        production - sale

    };

  }


  /*
   * ========================================
   * Heute
   * ========================================
   */

  private getToday(): string {

    return this.formatDate(
      new Date()
    );

  }


  /*
   * ========================================
   * Datum parsen
   * ========================================
   */

  private parseDate(
    value: string
  ): Date {

    const [
      year,
      month,
      day
    ] =
      value
        .split('-')
        .map(Number);


    return new Date(
      year,
      month - 1,
      day
    );

  }


  /*
   * ========================================
   * Datum formatieren
   * ========================================
   */

  private formatDate(
    date: Date
  ): string {

    const year =
      date.getFullYear();


    const month =
      String(
        date.getMonth() + 1
      ).padStart(
        2,
        '0'
      );


    const day =
      String(
        date.getDate()
      ).padStart(
        2,
        '0'
      );


    return `${year}-${month}-${day}`;

  }


  /*
   * ========================================
   * Titel
   * ========================================
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
