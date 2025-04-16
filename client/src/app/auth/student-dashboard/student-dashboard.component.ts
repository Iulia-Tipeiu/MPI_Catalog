import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { CourseService } from '../../services/course.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    MatDividerModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.css'],
})
export class StudentDashboardComponent implements OnInit {
  courses: any[] = [];
  loading = true;
  error = '';

  constructor(private router: Router, private courseService: CourseService) {}

  ngOnInit(): void {
    this.loadStudentCourses();
  }

  loadStudentCourses(): void {
    this.loading = true;

    this.courseService
      .getAllCourses()
      .pipe(
        catchError((error) => {
          this.error = 'Failed to load your courses. Please try again later.';
          console.error('Error loading student courses:', error);
          this.loading = false;
          return of({ courses: [] });
        })
      )
      .subscribe((response) => {
        this.courses = response.courses || [];
        this.loading = false;
      });
  }

  goToCourse(courseId: string): void {
    this.router.navigate(['/course', courseId]);
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }
}
