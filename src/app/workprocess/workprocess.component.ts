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

import {
  ProductionApiService
} from '../services/production-api.service';

import {
  Workstep
} from '../models/workprocess';


@Component({
  selector: 'app-workprocess',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './workprocess.html',
  styleUrl: './workprocess.css'
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
      Validators.min(1)
    ]
  ],

  duration: [
    '',
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
    this.getToday(),
    Validators.required
  ],

  ignore: [
    false
  ]

});


   private getToday(): string {

    const today = new Date();

    const year = today.getFullYear();
    const month = String(
      today.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      today.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

 private durationToMinutes(duration: string): number {

  const [hours, minutes] = duration
    .split(':')
    .map(Number);

  return hours * 60 + minutes;
}




  constructor() {
    this.loadWorksteps();
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


    const formValue = this.workprocessForm.getRawValue();

    const data = {
  ...formValue,

  duration: this.durationToMinutes(
    formValue.duration
  ),

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
          workstep_id: 0,
          duration: '',
          amount: 0,
          day: this.getToday(),
          ignore: false
        });

      },


      error: error => {

        console.error(
          'Fehler beim Erstellen des Arbeitsprozesses:',
          error
        );

        this.errorMessage =
          'Der Arbeitsprozess konnte nicht gespeichert werden.';

      }

    });
  }

}
