import { Routes } from '@angular/router';
import { GradeEntryComponent } from './classManagment/grade-entry/grade-entry.component';
import { CreateCourseComponent } from './create-course/create-course.component';
import { CourseDetailsComponent } from './course-details/course-details.component';

export const APP_ROUTES: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: '',
    loadChildren: () =>
      import('./auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  { path: 'grades', component: GradeEntryComponent },
  { path: 'create-course', component: CreateCourseComponent },
  { path: 'course/:id', component: CourseDetailsComponent }, // Correct path with parameter
  { path: '**', redirectTo: 'login' } // Wildcard route should be LAST
];
