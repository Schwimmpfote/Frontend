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


  /** Success message displayed after a successful submission. */
  successMessage = '';

  /** Error message displayed after a failed operation. */
  errorMessage = '';


  /** Categories available for performance records. */
  categories: PerformanceCategory[] = [
    'Sale',
    'Production'
  ];


  /** Form used to create a performance record. */
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

  /** Creates a performance record from the form data. */
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
