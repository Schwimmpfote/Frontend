import {
  Routes
} from '@angular/router';


export const routes: Routes = [

  {
    path: '',
    redirectTo: 'workprocess',
    pathMatch: 'full'
  },

  {
    path: 'workprocess',
    loadComponent: () =>
      import('./workprocess/workprocess.component')
        .then(
          m => m.WorkprocessComponent
        )
  },

  {
    path: 'performance_record',
    loadComponent: () =>
      import('./performance-record/performance-record.component')
        .then(
          m => m.PerformanceRecordComponent
        )
  },

  {
    path: 'evaluation',
    loadComponent: () =>
      import('./evaluation/evaluation.component')
        .then(
          m => m.EvaluationComponent
        )
  },

];
