import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CourseService } from '../services/course.service';

@Component({
  selector: 'app-add-students-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatListModule
  ],
  templateUrl: './add-students-dialog.component.html',
  styleUrls: ['./add-students-dialog.component.css']
})
export class AddStudentsDialogComponent implements OnInit {
  students: any[] = [];
  selectedStudents: string[] = [];
  loading = false;
  error = '';
  searchTerm = '';

  constructor(
    public dialogRef: MatDialogRef<AddStudentsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { courseId: string },
    private courseService: CourseService
  ) {}

  ngOnInit(): void {
    this.loadUnenrolledStudents();
  }

  loadUnenrolledStudents(): void {
    this.loading = true;
    this.courseService.getUnenrolledStudents(this.data.courseId).pipe(
      catchError(error => {
        this.error = 'Failed to load students. Please try again.';
        console.error('Error fetching unenrolled students:', error);
        this.loading = false;
        return of({ unenrolledStudents: [] });
      })
    ).subscribe(response => {
      this.students = response.unenrolledStudents || [];
      this.loading = false;
    });
  }

  toggleStudentSelection(studentId: string): void {
    const index = this.selectedStudents.indexOf(studentId);
    if (index === -1) {
      this.selectedStudents.push(studentId);
    } else {
      this.selectedStudents.splice(index, 1);
    }
  }

  isSelected(studentId: string): boolean {
    return this.selectedStudents.indexOf(studentId) !== -1;
  }

  filterStudents(): any[] {
    if (!this.searchTerm) return this.students;
    
    const term = this.searchTerm.toLowerCase();
    return this.students.filter(student => 
      student.first_name.toLowerCase().includes(term) || 
      student.last_name.toLowerCase().includes(term) || 
      student.username.toLowerCase().includes(term)
    );
  }

  enrollStudents(): void {
    if (this.selectedStudents.length === 0) return;
    
    this.loading = true;
    this.courseService.bulkEnrollStudents(this.data.courseId, this.selectedStudents).subscribe({
      next: response => {
        this.dialogRef.close({ success: true, count: response.enrolledCount });
      },
      error: error => {
        this.error = error.error?.message || 'Failed to enroll students. Please try again.';
        this.loading = false;
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}