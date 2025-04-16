import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { CourseService } from '../services/course.service';
import { AddStudentsDialogComponent } from '../add-students-dialog/add-students-dialog.component';

@Component({
  selector: 'app-course-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './course-details.component.html',
  styleUrls: ['./course-details.component.css']
})
export class CourseDetailsComponent implements OnInit {
  courseId: string = '';
  course: any = null;
  students: any[] = [];
  assignments: any[] = [];
  loading: boolean = true;
  error: string = '';
  currentUserRole: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    // Get the current user role from localStorage
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      this.currentUserRole = user.role;
    }

    // Get the course ID from the route parameters
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.courseId = id;
        this.loadCourseDetails();
      } else {
        this.error = 'Course ID not found';
        this.loading = false;
      }
    });
  }

  loadCourseDetails(): void {
    this.loading = true;
    this.error = '';

    this.courseService.getCourseById(this.courseId).pipe(
      catchError(error => {
        this.error = 'Failed to load course details. Please try again.';
        console.error('Error fetching course details:', error);
        this.loading = false;
        return of({ course: null, students: [], assignments: [] });
      })
    ).subscribe(response => {
      this.course = response.course;
      this.students = response.students || [];
      this.assignments = response.assignments || [];
      this.loading = false;
    });
  }

  goBack(): void {
    if (this.currentUserRole === 'teacher') {
      this.router.navigate(['/teacher']);
    } else if (this.currentUserRole === 'student') {
      this.router.navigate(['/student']);
    } else {
      this.router.navigate(['/']);
    }
  }

  // For teachers: navigate to add students page
  addStudents(): void {
    const dialogRef = this.dialog.open(AddStudentsDialogComponent, {
      width: '600px',
      data: { courseId: this.courseId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.snackBar.open(`Successfully enrolled ${result.count} student(s)`, 'Close', {
          duration: 3000
        });
        this.loadCourseDetails(); // Refresh the course details to show new students
      }
    });
  }

  // For teachers: navigate to create assignment page
  createAssignment(): void {
    this.router.navigate(['/course', this.courseId, 'create-assignment']);
  }

  // For teachers: remove a student from the course
  removeStudent(studentId: string): void {
    if (confirm('Are you sure you want to remove this student from the course?')) {
      this.courseService.unenrollStudent(this.courseId, studentId).subscribe({
        next: () => {
          this.students = this.students.filter(student => student.id !== studentId);
          this.snackBar.open('Student removed successfully', 'Close', {
            duration: 3000
          });
        },
        error: error => {
          console.error('Error removing student:', error);
          this.snackBar.open('Failed to remove student', 'Close', {
            duration: 3000
          });
        }
      });
    }
  }
}