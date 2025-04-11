import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-grade-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './grade-entry.component.html',
  styleUrls: ['./grade-entry.component.css']
})
export class GradeEntryComponent {
  gradeForm: FormGroup;
  fileName: string | null = null;

  constructor(private fb: FormBuilder) {
    this.gradeForm = this.fb.group({
      assignment_id: ['', Validators.required],
      student_id: ['', Validators.required],
      score: [null, [Validators.required, Validators.min(0), Validators.max(100)]],
      comment: ['']
    });
  }

  onSubmit() {
    if (this.gradeForm.valid) {
      console.log('Grade submitted:', this.gradeForm.value);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.fileName = file.name;
      console.log('File selected:', file);
      // You can process the CSV later
    }
  }
}
