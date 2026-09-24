// performance-record.component.ts

import { Component, inject } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { PerformanceApiService } from '../services/performance-api.service';

import {
  PerformanceCategory,
  PerformanceRecordInsert,
} from '../models/performance-record';

import { getToday } from '../shared/utils/date.util';

@Component({
  selector: 'app-performance-record',
  imports: [ReactiveFormsModule],
  templateUrl: './performance-record.html',
  styleUrl: './performance-record.css',
})
export class PerformanceRecordComponent {
  private fb = inject(FormBuilder);
  private api = inject(PerformanceApiService);

  successMessage = '';

  errorMessage = '';

  categories: PerformanceCategory[] = ['Sale', 'Production'];

  performanceRecordForm = this.fb.nonNullable.group({
    category: ['' as PerformanceCategory | '', Validators.required],

    amount: [
      0,
      [
        Validators.required,
        Validators.min(0),
      ],
    ],

    day: [getToday(), Validators.required],

    ignore: [false],
  });

  submit(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.performanceRecordForm.invalid) {
      this.performanceRecordForm.markAllAsTouched();

      this.errorMessage = this.getValidationErrorMessage();

      return;
    }

    const formValue = this.performanceRecordForm.getRawValue();

    if (
      formValue.category !== 'Sale' &&
      formValue.category !== 'Production'
    ) {
      this.performanceRecordForm.controls.category.markAsTouched();

      this.errorMessage =
        'Die Eingabe wurde abgelehnt: Es muss eine gültige Kategorie ausgewählt werden.';

      return;
    }

    if (formValue.amount < 0) {
      this.performanceRecordForm.controls.amount.markAsTouched();

      this.errorMessage =
        'Die Eingabe wurde abgelehnt: Die Menge darf nicht negativ sein.';

      return;
    }

    const today = getToday();

    if (formValue.day > today) {
      this.performanceRecordForm.controls.day.markAsTouched();

      this.errorMessage =
        'Die Eingabe wurde abgelehnt: Das Datum darf nicht in der Zukunft liegen.';

      return;
    }

    const data: PerformanceRecordInsert = {
      category: formValue.category,
      amount: formValue.amount,
      day: formValue.day,
      ignore: false,
    };

    this.api.createPerformanceRecord(data).subscribe({
      next: (response) => {
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
          ignore: false,
        });
      },

      error: (error) => {
        console.error(
          'Fehler beim Erstellen des Performance Records:',
          error
        );

        this.errorMessage =
          'Der Performance Record konnte nicht gespeichert werden.';
      },
    });
  }

  private getValidationErrorMessage(): string {
    const category =
      this.performanceRecordForm.controls.category;

    const amount =
      this.performanceRecordForm.controls.amount;

    const day =
      this.performanceRecordForm.controls.day;

    if (category.hasError('required')) {
      return 'Die Eingabe wurde abgelehnt: Bitte wählen Sie eine Kategorie aus.';
    }

    if (amount.hasError('required')) {
      return 'Die Eingabe wurde abgelehnt: Bitte geben Sie eine Menge ein.';
    }

    if (amount.hasError('min')) {
      return 'Die Eingabe wurde abgelehnt: Die Menge darf nicht negativ sein.';
    }

    if (day.hasError('required')) {
      return 'Die Eingabe wurde abgelehnt: Bitte wählen Sie ein Datum aus.';
    }

    return 'Die Eingabe wurde abgelehnt: Bitte überprüfen Sie Ihre Eingaben.';
  }
}
