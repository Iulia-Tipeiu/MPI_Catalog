import { Routes } from '@angular/router';

export const APP_ROUTES: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: '',
    loadChildren: () =>
      import('./auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  { path: '**', redirectTo: 'login' }
];
