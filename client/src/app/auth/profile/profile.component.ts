import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  imports: [CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  isEditing = false;
  isChangingPassword = false;

  constructor(private fb: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      first_name: ['John'],
      last_name: ['Doe'],
      phone: ['123-456-7890'],
      address: ['123 Main St']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  user = {
    username: 'johndoe',
    email: 'john@example.com',
    role: 'student',
    first_name: 'John',
    last_name: 'Doe',
    phone: '123-456-7890',
    address: '123 Main St'
  };

  

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // Save logic here
      console.log('Updated profile:', this.profileForm.value);
      // Send to backend here via a service
    }

  }



togglePasswordChange() {
  this.isChangingPassword = !this.isChangingPassword;
}

submitPasswordChange() {
  if (this.passwordForm.invalid) {
    alert('Please fill out all password fields.');
    return;
  }

  const { newPassword, confirmPassword } = this.passwordForm.value;
  if (newPassword !== confirmPassword) {
    alert('New passwords do not match.');
    return;
  }

  const payload = {
    currentPassword: this.passwordForm.value.currentPassword,
    newPassword: this.passwordForm.value.newPassword
  };

  console.log('Send to backend:', payload);
}}
