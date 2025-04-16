import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    MatDividerModule,
    MatButtonModule,
  ],
  templateUrl: './teacher-dashboard.component.html',
  styleUrls: ['./teacher-dashboard.component.css'],
})
export class TeacherDashboardComponent {
  constructor(private router: Router) {}

  courses = [
    { id: 'c1', course_name: 'Computer Science 101' },
    { id: 'c2', course_name: 'Digital Art Fundamentals' },
  ];

  assignments = [
    { title: 'Intro to Python', course_name: 'Computer Science 101' },
    { title: 'Digital Self-Portrait', course_name: 'Digital Art Fundamentals' },
  ];

  enrollments = [
    { course_name: 'Computer Science 101', students: ['Alice', 'Bob'] },
    { course_name: 'Digital Art Fundamentals', students: ['Cara', 'Dan'] },
  ];

  goToCourse(courseId: string) {
    console.log('Navigate to course:', courseId);
  }
  goToProfile() {
    this.router.navigate(['/profile']);
  }
}
