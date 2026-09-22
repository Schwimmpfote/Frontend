import {
  Component,
  inject
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  PerformanceApiService
} from '../services/performance-api.service';

import {
  PerformanceCategory,
  PerformanceRecordInsert
} from '../models/performance-record';

import {
  getToday
} from '../shared/utils/date.util';


@Component({
  selector: 'app-performance-record',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './performance-record.html',
  styleUrl: './performance-record.css'
})
export class PerformanceRecordComponent {

  private fb = inject(FormBuilder);
  private api = inject(PerformanceApiService);


  /**
   * Provides feedback after the record has been persisted successfully.
   * An empty value indicates that no success notification is currently shown.
   */
  successMessage = '';


  /**
   * Contains the user-facing message for validation or API failures.
   * It is cleared whenever a new submission is started.
   */
  errorMessage = '';


  /**
   * Defines the business categories that can be assigned to a performance record.
   * These values correspond directly to the categories accepted by the API model.
   */
  categories: PerformanceCategory[] = [
    'Sale',
    'Production'
  ];


  /**
   * Captures all values required to create a performance record.
   * The selected day defaults to the current date so that new records
   * can be entered without manually specifying today's date.
   */
  performanceRecordForm = this.fb.nonNullable.group({

    category: [
      '' as PerformanceCategory | '',
      Validators.required
    ],

    amount: [
      0,
      [
        Validators.required,
        Validators.min(0)
      ]
    ],

    day: [
      getToday(),
      Validators.required
    ],

    ignore: [
      false
    ]

  });


  /**
   * Validates the form and sends the resulting record to the performance API.
   * Invalid input prevents submission and marks all controls as touched
   * so that validation feedback can be displayed by the template.
   */
  submit(): void {

    this.successMessage = '';
    this.errorMessage = '';

    if (this.performanceRecordForm.invalid) {

      this.performanceRecordForm.markAllAsTouched();
      return;
    }

    const formValue =
      this.performanceRecordForm.getRawValue();

    if (
      formValue.category !== 'Sale' &&
      formValue.category !== 'Production'
    ) {

      this.performanceRecordForm.controls.category.markAsTouched();
      return;
    }

    const data: PerformanceRecordInsert = {
      category: formValue.category,
      amount: formValue.amount,
      day: formValue.day,
      ignore: false
    };

    this.api.createPerformanceRecord(data).subscribe({

      next: response => {

        console.log(
          'Performance Record erfolgreich erstellt:',
          response
        );

        this.successMessage =
          'Der Performance Record wurde erfolgreich gespeichert.';

        this.performanceRecordForm.reset({
          category: '',
          amount: 0,
          day: getToday(),
          ignore: false
        });
      },

      error: error => {

        console.error(
          'Fehler beim Erstellen des Performance Records:',
          error
        );

        this.errorMessage =
          'Der Performance Record konnte nicht gespeichert werden.';
      }

    });
  }

}
