import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Grade {
  assignment_id: string;
  score: number;
  comment?: string;
}

export interface Assignment {
  id: string;
  title: string;
  course_name: string;
  max_score: number;
  score?: number;
}

export interface Course {
  id: string;
  courseId?: string;
  courseName?: string;
  course_name?: string;
  teacher?: string;
  assignments?: Assignment[];
  stats?: {
    totalAssignments: number;
    gradedAssignments: number;
    averageScore: number | null;
  };
}

@Injectable({
  providedIn: 'root',
})
export class GradesService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  // Get all grades for all courses
  getAllGrades(): Observable<{ courses: Course[]; overallStats: any }> {
    return this.http.get<{ courses: Course[]; overallStats: any }>(
      `${this.apiUrl}/grades`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  // Get grade history
  getGradeHistory(): Observable<{ grades: any[] }> {
    return this.http.get<{ grades: any[] }>(`${this.apiUrl}/grades/history`, {
      headers: this.getAuthHeaders(),
    });
  }

  // Get grade statistics
  getGradeStatistics(): Observable<{ statistics: any }> {
    return this.http.get<{ statistics: any }>(
      `${this.apiUrl}/grades/statistics`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }
}
