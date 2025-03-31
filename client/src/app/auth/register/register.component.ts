import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  form: FormGroup;
  userData: any;

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.form.valid) {
      const userData = {
        username: this.form.get('username')!.value,
        firstName: this.form.get('firstName')!.value,
        lastName: this.form.get('lastName')!.value,
        email: this.form.get('email')!.value,
        role: this.form.get('role')!.value,
        password: this.form.get('password')!.value,
      };
      // console.log('Registering user with:', userData); // Commented out
      this.authService.register(
        userData.username,
        userData.password,
        userData.email,
        userData.role,
        userData.firstName,
        userData.lastName
      ).subscribe({
        next: (registeredUser) => {
          // console.log('User registered:', registeredUser); // Commented out
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Registration failed:', error);
          alert('Registration failed. Please try again.');
        },
      });
    } else {
      alert('Please fill in the form correctly.');
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
