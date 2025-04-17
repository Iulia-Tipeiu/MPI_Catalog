import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { CourseService } from '../../services/course.service';
import { GradesService } from '../../services/grade.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

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
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.css'],
})
export class StudentDashboardComponent implements OnInit {
  courses: any[] = [];
  loading = true;
  error = '';
  courseGrades: { [courseId: string]: number | null } = {};

  constructor(
    private router: Router,
    private courseService: CourseService,
    private gradesService: GradesService
  ) {}

  ngOnInit(): void {
    this.loadStudentCoursesAndGrades();
  }

  loadStudentCoursesAndGrades(): void {
    this.loading = true;

    // Use forkJoin to make parallel requests
    forkJoin({
      courses: this.courseService.getAllCourses().pipe(
        catchError((error) => {
          console.error('Error loading courses:', error);
          return of({ courses: [] });
        })
      ),
      grades: this.gradesService.getAllGrades().pipe(
        catchError((error) => {
          console.error('Error loading grades:', error);
          return of({ courses: [], overallStats: {} });
        })
      ),
    }).subscribe((results) => {
      this.courses = results.courses.courses || [];

      console.log('Courses:', this.courses); // Debug output
      console.log('Grades data:', results.grades); // Debug output

      // Map the grade data to courses
      if (results.grades && results.grades.courses) {
        results.grades.courses.forEach((course) => {
          // Normalize course ID handling various API response formats
          const courseId = course.id || course.courseId;
          if (courseId) {
            // Make sure we're storing the grade as a number
            const average = course.stats?.averageScore;
            this.courseGrades[courseId] =
              average !== undefined && average !== null
                ? typeof average === 'string'
                  ? parseFloat(average)
                  : average
                : null;

            console.log(
              `Course ${courseId} average: ${this.courseGrades[courseId]}`
            ); // Debug
          }
        });
      }

      this.loading = false;
    });
  }

  goToCourse(courseId: string): void {
    this.router.navigate(['/course', courseId]);
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  getGradeColor(grade: number | null | undefined): string {
    if (grade === null || grade === undefined) return 'gray';
    if (grade >= 90) return '#4CAF50'; // Green for A
    if (grade >= 80) return '#8BC34A'; // Light green for B
    if (grade >= 70) return '#FFEB3B'; // Yellow for C
    if (grade >= 60) return '#FF9800'; // Orange for D
    return '#F44336'; // Red for F
  }

  getGradeLabel(grade: number | null | undefined): string {
    if (grade === null || grade === undefined) return 'Not graded yet';
    return `Average: ${grade}%`;
  }
}
