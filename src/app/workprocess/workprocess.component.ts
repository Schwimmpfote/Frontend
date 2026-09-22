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

import {
  getToday
} from '../shared/utils/date.util';



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


  /** Available work steps. */
  worksteps: Workstep[] = [];

  /** Indicates whether work steps are currently loading. */
  workstepsLoading = true;

  /** Success message displayed after a successful submission. */
  successMessage = '';

  /** Error message displayed after a failed operation. */
  errorMessage = '';


  /** Form used to create a work process entry. */
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
      getToday(),
      Validators.required
    ],

    ignore: [
      false
    ]

  });


  constructor() {
    this.loadWorksteps();
  }

  /** Converts a HH:mm duration to minutes. */
  private durationToMinutes(
    duration: string
  ): number {

    const [
      hours,
      minutes
    ] =
      duration
        .split(':')
        .map(Number);

    return hours * 60 + minutes;
  }


  /** Loads the available work steps. */
  private loadWorksteps(): void {

    this.api.getWorksteps().subscribe({

      next: worksteps => {

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


  /** Creates a work process entry from the form data. */
  submit(): void {

    this.successMessage = '';
    this.errorMessage = '';

    if (this.workprocessForm.invalid) {

      this.workprocessForm.markAllAsTouched();
      return;
    }

    const formValue =
      this.workprocessForm.getRawValue();

    const data = {
      ...formValue,
      duration:
        this.durationToMinutes(
          formValue.duration
        ),
      ignore: false
    };

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
          day: getToday(),
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
