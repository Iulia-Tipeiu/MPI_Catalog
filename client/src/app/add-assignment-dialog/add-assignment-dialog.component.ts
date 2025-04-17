import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CourseService } from '../services/course.service';

@Component({
  selector: 'app-add-assignment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSliderModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './add-assignment-dialog.component.html',
  styleUrls: ['./add-assignment-dialog.component.css'],
})
export class AddAssignmentDialogComponent {
  assignmentForm: FormGroup;
  loading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddAssignmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { courseId: string },
    private courseService: CourseService
  ) {
    this.assignmentForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      maxScore: [100, [Validators.required, Validators.min(1), Validators.max(100)]]
    });
  }

  onSubmit(): void {
    if (this.assignmentForm.valid) {
      this.loading = true;
      this.error = '';

      const assignmentData = {
        title: this.assignmentForm.value.title,
        description: this.assignmentForm.value.description || '',
        max_score: this.assignmentForm.value.maxScore
      };

      this.courseService.createAssignment(this.data.courseId, assignmentData)
        .subscribe({
          next: (response) => {
            this.loading = false;
            this.dialogRef.close({ success: true, assignment: response.assignment });
          },
          error: (error) => {
            this.loading = false;
            this.error = error.error?.message || 'Failed to create assignment. Please try again.';
            console.error('Error creating assignment:', error);
          }
        });
    } else {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.assignmentForm.controls).forEach(field => {
        const control = this.assignmentForm.get(field);
        control?.markAsTouched({ onlySelf: true });
      });
    }
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.assignmentForm.get(controlName);
    return control !== null && control.touched && control.hasError(errorName);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}