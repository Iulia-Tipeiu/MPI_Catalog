import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-profile',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  isEditing = false;
  isChangingPassword = false;

  // Static user info
  user: { 
    username: string; 
    email: string;
    role: string; 
    firstName: string; 
    lastName: string; 
    phone: number, 
    address: string } | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    // Initialize forms
    this.profileForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      phone: [''],
      address: [''],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    });

    this.loadUserInfo();
    this.loadProfile();
  }

  loadUserInfo() {
    const userData = localStorage.getItem('user');
    if (userData) {
      this.user = JSON.parse(userData);
      this.profileForm.patchValue({
        first_name: this.user?.firstName ?? '',
        last_name: this.user?.lastName ?? '',
        phone: this.user?.phone ?? '',
        address: this.user?.address ?? '',
      });
    } else {
      console.error('User data not found. Redirecting to login.');
      this.router.navigate(['/login']);
    }
  }

  loadProfile() {
    this.profileService.getProfile().subscribe({
      next: (profile: any) => {
        // console.log('Profile data received:', profile); // Commented out
        this.profileForm.patchValue({
          first_name: profile.firstName,
          last_name: profile.lastName,
          phone: profile.phone || '',
          address: profile.address || '',
        });
      },
      error: (err: any) => {
        console.error('Failed to load profile:', err);
        alert('Failed to load profile. Please try again.');
      },
    });
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.saveProfile();
    }
  }

  saveProfile() {
    if (this.profileForm.invalid) {
      alert('Please fill out all required fields.');
      return;
    }

    const updatedProfile = {
      firstName: this.profileForm.value.first_name,
      lastName: this.profileForm.value.last_name,
      phone: this.profileForm.value.phone,
      address: this.profileForm.value.address,
    };

    // console.log('Form data to be saved:', updatedProfile); // Commented out

    this.profileService.updateProfile(updatedProfile).subscribe({
      next: (response: any) => {
        // console.log('Profile updated successfully:', response); // Commented out
        alert('Profile updated successfully.');
        this.isEditing = false;
      },
      error: (err: any) => {
        console.error('Failed to update profile:', err);
        alert('Failed to update profile. Please try again.');
      },
    });
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
      newPassword: this.passwordForm.value.newPassword,
    };

    this.profileService.changePassword(payload).subscribe({
      next: (response: any) => {
        console.log('Password changed successfully:', response);
        alert('Password changed successfully.');
        this.passwordForm.reset();
        this.isChangingPassword = false;
      },
      error: (err: any) => {
        console.error('Failed to change password:', err);
        alert('Failed to change password. Please try again.');
      },
    });
  }
}
