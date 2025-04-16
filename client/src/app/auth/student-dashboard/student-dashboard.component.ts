import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { Router } from '@angular/router';

@Component({
  selector: 'app-student-dashboard',
  imports: [CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatDividerModule,],
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.css']
})
export class StudentDashboardComponent {
  studentId = 'mock-student-123';

  constructor(private router: Router){}
  courses = [
    { id: 'course1', course_name: 'Mathematics 101' },
    { id: 'course2', course_name: 'Introduction to Physics' },
    { id: 'course3', course_name: 'English Literature' }
  ];

  assignments = [
    { id: 'a1', title: 'Algebra Homework', course_name: 'Mathematics 101' },
    { id: 'a2', title: 'Newton’s Laws Essay', course_name: 'Introduction to Physics' },
    { id: 'a3', title: 'Poetry Analysis', course_name: 'English Literature' }
  ];

  grades = [
    { assignment_id: 'a1', score: 95.5 },
    { assignment_id: 'a2', score: 88 },
    { assignment_id: 'a3', score: 91 }
  ];

  goToProfile() {
    this.router.navigate(['/profile']);
  }
}
