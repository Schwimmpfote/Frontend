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


/**
 * Handles the creation of production work-process records
 * and provides the available work steps for selection.
 */
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


  /**
   * Contains the work steps retrieved from the backend
   * and presented as selectable production activities.
   */
  worksteps: Workstep[] = [];


  /**
   * Remains active until the initial work-step request has completed,
   * allowing the template to distinguish loading from an empty result.
   */
  workstepsLoading = true;


  /**
   * Provides user feedback when a work-process entry has been stored successfully.
   */
  successMessage = '';


  /**
   * Contains user-facing information about loading or submission failures.
   */
  errorMessage = '';


  /**
   * Collects the values required to create a work-process record.
   * Duration is entered as a time value and converted to minutes before submission.
   */
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


  /**
   * Loads the selectable work steps immediately after component initialization.
   */
  constructor() {
    this.loadWorksteps();
  }


  /**
   * Converts the form's HH:mm representation into the minute-based value
   * expected by the backend.
   *
   * @param duration Duration string in HH:mm format.
   * @returns Total duration in minutes.
   */
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


  /**
   * Retrieves the available work steps and updates the loading state.
   * Failed requests are reported through the component's error message.
   */
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


  /**
   * Validates the form, converts the entered duration and submits
   * the resulting work-process record to the backend.
   * Invalid form values stop the request and expose validation feedback.
   */
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
