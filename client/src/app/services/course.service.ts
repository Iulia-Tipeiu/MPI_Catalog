import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

export interface Course {
  id: string;
  course_name: string;
  description?: string;
  student_count?: number;
  teacher_username?: string;
  teacher_first_name?: string;
  teacher_last_name?: string;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  max_score: number;
  created_at: string;
  course_name?: string;
}

export interface Student {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
}

export interface Enrollment {
  course_name: string;
  students: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getAllCourses(): Observable<{courses: Course[]}> {
    return this.http.get<{courses: Course[]}>(`${this.apiUrl}/course`, {
    headers: this.getAuthHeaders()
    });
  }

  getCourseById(id: string): Observable<{course: Course, students: Student[], assignments: Assignment[]}> {
    return this.http.get<{course: Course, students: Student[], assignments: Assignment[]}>(`${this.apiUrl}/course/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  getAssignments(): Observable<{assignments: Assignment[]}> {
    return this.http.get<{assignments: Assignment[]}>(`${this.apiUrl}/assignments`, {
    headers: this.getAuthHeaders()
    });
  }

  createCourse(courseData: any): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/course`, courseData, {
    headers: this.getAuthHeaders()
  });
}

  unenrollStudent(courseId: string, studentId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/course/${courseId}/students/${studentId}`, {
      headers: this.getAuthHeaders()
    });
  }

  navigateToCourse(courseId: string): void {
    this.router.navigate(['/course', courseId]);
  }

  getUnenrolledStudents(courseId: string): Observable<{unenrolledStudents: any[]}> {
    return this.http.get<{unenrolledStudents: any[]}>(`${this.apiUrl}/course/${courseId}/unenrolled-students`, {
      headers: this.getAuthHeaders()
    });
  }

  bulkEnrollStudents(courseId: string, studentIds: string[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/course/${courseId}/bulk-enroll`, { studentIds }, {
      headers: this.getAuthHeaders()
    });
  }
}