import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { Assignment, Course, Grade, GradesService } from '../../services/grade.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.css']
})
export class StudentDashboardComponent implements OnInit {
  courses: Course[] = [];
  assignments: Assignment[] = [];
  grades: Grade[] = [];
  loading = true;
  error = '';
  overallStats: any = null;

  constructor(private router: Router, private gradesService: GradesService) {}

  ngOnInit(): void {
    this.loadStudentData();
  }

  loadStudentData(): void {
    this.loading = true;

    // We'll use forkJoin to make multiple API calls concurrently
    forkJoin({
      allGrades: this.gradesService.getAllGrades().pipe(
        catchError(error => {
          console.error('Error fetching grades:', error);
          return of({ courses: [], overallStats: null });
        })
      ),
      gradeHistory: this.gradesService.getGradeHistory().pipe(
        catchError(error => {
          console.error('Error fetching grade history:', error);
          return of({ grades: [] });
        })
      )
    }).subscribe({
      next: (results) => {
        // Process courses and overall stats
        this.courses = results.allGrades.courses || [];
        this.overallStats = results.allGrades.overallStats;
        
        // Extract assignments from all courses
        this.assignments = [];
        this.courses.forEach(course => {
          if (course.assignments) {
            course.assignments.forEach(assignment => {
              if (assignment.score !== null && assignment.score !== undefined) {
                this.assignments.push({
                  id: assignment.id,
                  title: assignment.title,
                  course_name: course.courseName || course.course_name || '',
                  max_score: assignment.max_score,
                  score: assignment.score
                });
              }
            });
          }
        });

        // Process grades from grade history
        this.grades = results.gradeHistory.grades.map(g => ({
          assignment_id: g.id,
          score: g.score,
          comment: g.comment
        }));

        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load your data. Please try again later.';
        console.error('Error loading student data:', error);
        this.loading = false;
      }
    });
  }

  goToCourse(courseId: string): void {
    this.router.navigate(['/course', courseId]);
  }
  
  goToProfile(): void {
    this.router.navigate(['/profile']);
  }
}
