import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { CourseService, Course } from '../../services/course.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    MatDividerModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './teacher-dashboard.component.html',
  styleUrls: ['./teacher-dashboard.component.css'],
})
export class TeacherDashboardComponent implements OnInit {
  courses: Course[] = [];
  loading = true;
  error = '';

  constructor(private router: Router, private courseService: CourseService) {}

  ngOnInit(): void {
    this.loading = true;
    this.loadTeacherData();
  }

  loadTeacherData(): void {
    this.courseService.getAllCourses().pipe(
      catchError(error => {
        this.error = 'Failed to load courses. Please try again later.';
        console.error('Error fetching courses:', error);
        this.loading = false;
        return of({ courses: [] });
      })
    ).subscribe(response => {
      this.courses = response.courses;
      this.loading = false;
    });
  }

  goToCourse(courseId: string) {
    this.router.navigate(['/course', courseId]);
  }
  
  goToProfile() {
    this.router.navigate(['/profile']);
  }

  createNewCourse() {
    this.router.navigate(['/create-course']);
  }
}