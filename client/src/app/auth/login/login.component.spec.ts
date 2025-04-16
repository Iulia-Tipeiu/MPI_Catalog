import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

describe('LoginComponent Critical Path', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    // Create spy for AuthService
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        ReactiveFormsModule,
        FormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        BrowserAnimationsModule,
        CommonModule,
        LoginComponent,
      ],
      providers: [{ provide: AuthService, useValue: authServiceSpy }],
    }).compileComponents();

    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the login component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form fields', () => {
    expect(component.form.get('username')?.value).toBe('');
    expect(component.form.get('password')?.value).toBe('');
  });

  it('should validate username and password presence', () => {
    // Initially form should be invalid
    expect(component.form.valid).toBeFalsy();

    // Set only username
    component.form.get('username')?.setValue('testuser');
    expect(component.form.valid).toBeFalsy();

    // Set only password
    component.form.get('username')?.setValue('');
    component.form.get('password')?.setValue('password123');
    expect(component.form.valid).toBeFalsy();

    // Set both fields
    component.form.get('username')?.setValue('testuser');
    component.form.get('password')?.setValue('password123');
    expect(component.form.valid).toBeTruthy();
  });

  it('should call AuthService.login when form is submitted with valid data', fakeAsync(() => {
    // Setup successful login response
    const mockResponse = {
      token: 'fake-jwt-token',
      user: { id: 1, username: 'testuser' },
    };
    authService.login.and.returnValue(of(mockResponse));

    // Spy on router.navigate
    spyOn(router, 'navigate');

    // Fill in form
    component.form.get('username')?.setValue('testuser');
    component.form.get('password')?.setValue('password123');

    // Submit form programmatically
    component.onSubmit();
    tick(); // Process all pending asynchronous activities

    // Verify service was called with correct params
    expect(authService.login).toHaveBeenCalledWith('testuser', 'password123');

    // Verify token and user were saved to localStorage
    expect(localStorage.getItem('token')).toBe('fake-jwt-token');
    expect(localStorage.getItem('user')).toBe(
      JSON.stringify(mockResponse.user)
    );

    // Verify redirect
    expect(router.navigate).toHaveBeenCalledWith(['/profile']);
  }));

  it('should display error when login fails', fakeAsync(() => {
    // Setup failed login response
    authService.login.and.returnValue(
      throwError(() => new Error('Invalid credentials'))
    );

    // Spy on console.error and window.alert
    spyOn(console, 'error');
    spyOn(window, 'alert');

    // Fill in form
    component.form.get('username')?.setValue('wronguser');
    component.form.get('password')?.setValue('wrongpass');

    // Submit form
    component.onSubmit();
    tick(); // Process all pending asynchronous activities

    // Verify error handling
    expect(console.error).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Invalid username or password.');
  }));

  it('should redirect to register page when "Register" button is clicked', () => {
    // Spy on router.navigate
    spyOn(router, 'navigate');

    // Find register button and click it
    const registerButton = fixture.debugElement.query(
      By.css('.redirect-button button')
    );
    registerButton.triggerEventHandler('click', null);

    // Verify navigation
    expect(router.navigate).toHaveBeenCalledWith(['/register']);
  });

  it('should test complete login flow via UI interaction', fakeAsync(() => {
    // Setup successful login response
    const mockResponse = {
      token: 'fake-jwt-token',
      user: { id: 1, username: 'testuser' },
    };
    authService.login.and.returnValue(of(mockResponse));

    // Spy on router.navigate
    spyOn(router, 'navigate');

    // Get form elements
    const usernameInput = fixture.debugElement.query(
      By.css('input[type="username"]')
    ).nativeElement;
    const passwordInput = fixture.debugElement.query(
      By.css('input[type="password"]')
    ).nativeElement;
    const submitButton = fixture.debugElement.query(
      By.css('button[type="submit"]')
    ).nativeElement;

    // Fill in form via UI
    usernameInput.value = 'testuser';
    usernameInput.dispatchEvent(new Event('input'));

    passwordInput.value = 'password123';
    passwordInput.dispatchEvent(new Event('input'));

    // Update form model with UI changes
    fixture.detectChanges();

    // Submit form via UI
    submitButton.click();
    tick(); // Process all pending asynchronous activities

    // Verify service was called with correct params
    expect(authService.login).toHaveBeenCalledWith('testuser', 'password123');

    // Verify token and user were saved to localStorage
    expect(localStorage.getItem('token')).toBe('fake-jwt-token');
    expect(localStorage.getItem('user')).toBe(
      JSON.stringify(mockResponse.user)
    );

    // Verify redirect
    expect(router.navigate).toHaveBeenCalledWith(['/profile']);
  }));

  // Clean up after tests
  afterEach(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  });
});
