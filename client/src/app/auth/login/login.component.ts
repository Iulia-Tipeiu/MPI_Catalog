import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../services/auth.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    HttpClientModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  form: FormGroup;

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {
    this.form = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.form.valid) {
      const username = this.form.value.username;
      const password = this.form.value.password;

      this.authService.login(username, password).subscribe({
        next: (response: any) => {
          // console.log('Login successful:', response); // Commented out

          // Save the token in localStorage
          localStorage.setItem('token', response.token);

          // Save the user information in localStorage
          localStorage.setItem('user', JSON.stringify(response.user));          

          const userRole = response.user.role;
          if(userRole === 'teacher' || userRole === 'student') {
            this.router.navigate([`/${userRole}`]);
          } else {
            alert('Invalid user role. Please contact support.');
          }
          
        },
        error: (error) => {
          console.error('Login failed:', error);
          alert('Invalid username or password.');
        },
      });
    } else {
      alert('Please enter valid username and password.');
    }
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}
