import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { app } from './app/app';

bootstrapApplication(app, appConfig)
  .catch((err) => console.error(err));
