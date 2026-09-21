import {
  ChangeDetectorRef,
  Component,
  inject
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { ProductionApiService } from './services/production-api.service';

import {
  Employee,
  Workstep
} from './models/workprocess';


@Component({
  selector: 'app-root',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class app {

  private fb = inject(FormBuilder);
  private api = inject(ProductionApiService);
  private cdr = inject(ChangeDetectorRef);


  employees: Employee[] = [];
  worksteps: Workstep[] = [];

  employeesLoading = true;
  workstepsLoading = true;

  successMessage = '';
  errorMessage = '';

  workprocessForm = this.fb.nonNullable.group({
    employee_id: [
      0,
      [
        Validators.required,
        Validators.min(1)
      ]
    ],

    workstep_id: [
      0,
      [
        Validators.required,
        Validators.min(1)
      ]
    ],

    duration: [
      0,
      [
        Validators.required,
        Validators.min(0)
      ]
    ],

    amount: [
      0,
      [
        Validators.required,
        Validators.min(0)
      ]
    ],

    day: [
      '',
      Validators.required
    ],

    ignore: [
      false
    ]
  });


  constructor() {
    this.loadEmployees();
    this.loadWorksteps();
  }

  private loadEmployees(): void {

    console.log('Lade Mitarbeiter ...');

    this.api.getEmployees().subscribe({
      next: employees => {

        console.log(
          'Mitarbeiter erhalten:',
          employees
        );

        this.employees = employees;
        this.employeesLoading = false;

        this.cdr.detectChanges();
      },

      error: error => {

        console.error(
          'Fehler beim Laden der Mitarbeiter:',
          error
        );

        this.employeesLoading = false;
        this.errorMessage =
          'Die Mitarbeiter konnten nicht geladen werden.';

        this.cdr.detectChanges();
      }
    });
  }



  private loadWorksteps(): void {

    console.log('Lade Worksteps ...');

    this.api.getWorksteps().subscribe({
      next: worksteps => {

        console.log(
          'Worksteps erhalten:',
          worksteps
        );

        this.worksteps = worksteps;
        this.workstepsLoading = false;

        this.cdr.detectChanges();
      },

      error: error => {

        console.error(
          'Fehler beim Laden der Worksteps:',
          error
        );

        this.workstepsLoading = false;
        this.errorMessage =
          'Die Arbeitsschritte konnten nicht geladen werden.';

        this.cdr.detectChanges();
      }
    });
  }



  submit(): void {

    this.successMessage = '';
    this.errorMessage = '';

    if (this.workprocessForm.invalid) {
      this.workprocessForm.markAllAsTouched();
      return;
    }

    const data = {
      ...this.workprocessForm.getRawValue(),
      ignore: false
    };

    console.log(
      'Sende Workprozess:',
      data
    );

    this.api.createWorkprocess(data).subscribe({

      next: response => {

        console.log(
          'Workprozess erfolgreich erstellt:',
          response
        );

        this.successMessage =
          'Der Workprozess wurde erfolgreich gespeichert.';

        this.workprocessForm.reset({
          employee_id: 0,
          workstep_id: 0,
          duration: 0,
          amount: 0,
          day: '',
          ignore: false
        });
      },

      error: error => {

        console.error(
          'Fehler beim Erstellen des Workprozesses:',
          error
        );

        this.errorMessage =
          'Der Workprozess konnte nicht gespeichert werden.';
      }
    });
  }

}
