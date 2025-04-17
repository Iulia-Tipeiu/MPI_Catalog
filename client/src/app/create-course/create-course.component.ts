import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { CourseService } from '../services/course.service';

@Component({
  selector: 'app-create-course',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule
  ],
  templateUrl: './create-course.component.html',
  styleUrls: ['./create-course.component.css']
})
export class CreateCourseComponent implements OnInit {
  courseForm: FormGroup;
  submitting = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private courseService: CourseService,
    private snackBar: MatSnackBar
  ) {
    this.courseForm = this.fb.group({
      course_name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    // Component initialization if needed
  }

  onSubmit(): void {
    if (this.courseForm.valid) {
      this.submitting = true;
      this.error = '';
      
      const courseData = {
        courseName: this.courseForm.value.course_name,
        description: this.courseForm.value.description
      };
      
      this.courseService.createCourse(courseData).subscribe({
        next: (response) => {
          this.submitting = false;
          this.snackBar.open('Course created successfully!', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
          this.router.navigate(['/teacher']);
        },
        error: (error) => {
          this.submitting = false;
          console.error('Error creating course:', error);
          this.error = error.error?.message || 'Failed to create course. Please try again.';
          this.snackBar.open(this.error, 'Close', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
        }
      });
    } else {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.courseForm.controls).forEach(field => {
        const control = this.courseForm.get(field);
        control?.markAsTouched({ onlySelf: true });
      });
    }
  }

  // Helper methods for form validation
  hasError(controlName: string, errorName: string): boolean {
    const control = this.courseForm.get(controlName);
    return control !== null && control.hasError(errorName) && control.touched;
  }

  cancel(): void {
    this.router.navigate(['/teacher']);
  }
}