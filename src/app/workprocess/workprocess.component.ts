// workprocess.component.ts

import { ChangeDetectorRef, Component, inject } from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { ProductionApiService } from '../services/production-api.service';

import { Workstep } from '../models/workprocess';

import { getToday } from '../shared/utils/date.util';

@Component({
  selector: 'app-workprocess',
  imports: [ReactiveFormsModule],
  templateUrl: './workprocess.html',
  styleUrl: './workprocess.css',
})
export class WorkprocessComponent {
  private fb = inject(FormBuilder);
  private api = inject(ProductionApiService);
  private cdr = inject(ChangeDetectorRef);

  worksteps: Workstep[] = [];

  workstepsLoading = true;

  successMessage = '';

  errorMessage = '';

  workprocessForm = this.fb.nonNullable.group({
    employee_id: [],

    workstep_id: [
      0,
      [
        Validators.required,
        Validators.min(1),
      ],
    ],

    duration: [
      '',
      Validators.required,
    ],

    amount: [
      0,
      [
        Validators.required,
        Validators.min(0),
      ],
    ],

    day: [
      getToday(),
      Validators.required,
    ],

    ignore: [false],
  });

  constructor() {
    this.loadWorksteps();
  }

  private durationToMinutes(
    duration: string
  ): number {
    const [hours, minutes] =
      duration
        .split(':')
        .map(Number);

    return hours * 60 + minutes;
  }

  private loadWorksteps(): void {
    this.api.getWorksteps().subscribe({
      next: (worksteps) => {
        this.worksteps = worksteps;

        this.workstepsLoading = false;

        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error(
          'Fehler beim Laden der Worksteps:',
          error
        );

        this.workstepsLoading = false;

        this.errorMessage =
          'Die Arbeitsschritte konnten nicht geladen werden.';

        this.cdr.detectChanges();
      },
    });
  }

  submit(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.workprocessForm.invalid) {
      this.workprocessForm.markAllAsTouched();

      this.errorMessage =
        this.getValidationErrorMessage();

      return;
    }

    const formValue =
      this.workprocessForm.getRawValue();

    if (formValue.amount < 0) {
      this.workprocessForm.controls.amount.markAsTouched();

      this.errorMessage =
        'Die Eingabe wurde abgelehnt: Die Menge darf nicht negativ sein.';

      return;
    }

    const today = getToday();

    if (formValue.day > today) {
      this.workprocessForm.controls.day.markAsTouched();

      this.errorMessage =
        'Die Eingabe wurde abgelehnt: Das Datum darf nicht in der Zukunft liegen.';

      return;
    }

    const data = {
      ...formValue,

      duration:
        this.durationToMinutes(
          formValue.duration
        ),

      ignore: false,
    };

    this.api.createWorkprocess(data).subscribe({
      next: (response) => {
        console.log(
          'Workprozess erfolgreich erstellt:',
          response
        );

        this.successMessage =
          'Der Workprozess wurde erfolgreich gespeichert.';

        this.workprocessForm.reset({
          workstep_id: 0,
          duration: '',
          amount: 0,
          day: getToday(),
          ignore: false,
        });
      },

      error: (error) => {
        console.error(
          'Fehler beim Erstellen des Arbeitsprozesses:',
          error
        );

        this.errorMessage =
          'Der Arbeitsprozess konnte nicht gespeichert werden.';
      },
    });
  }

  private getValidationErrorMessage(): string {
    const workstep =
      this.workprocessForm.controls.workstep_id;

    const duration =
      this.workprocessForm.controls.duration;

    const amount =
      this.workprocessForm.controls.amount;

    const day =
      this.workprocessForm.controls.day;

    if (workstep.hasError('required')) {
      return 'Die Eingabe wurde abgelehnt: Bitte wählen Sie einen Arbeitsschritt aus.';
    }

    if (workstep.hasError('min')) {
      return 'Die Eingabe wurde abgelehnt: Bitte wählen Sie einen gültigen Arbeitsschritt aus.';
    }

    if (duration.hasError('required')) {
      return 'Die Eingabe wurde abgelehnt: Bitte geben Sie eine Dauer ein.';
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
