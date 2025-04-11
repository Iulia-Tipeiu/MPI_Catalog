import { Routes } from '@angular/router';
import { GradeEntryComponent } from './classManagment/grade-entry/grade-entry.component';

export const APP_ROUTES: Routes = [
  // { path: '', redirectTo: 'login', pathMatch: 'full' },
  // {
  //   path: '',
  //   loadChildren: () =>
  //     import('./auth/auth.routes').then(m => m.AUTH_ROUTES)
  // },
  // { path: '**', redirectTo: 'login' },
  { path: 'grades', component: GradeEntryComponent },
];
