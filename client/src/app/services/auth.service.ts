import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { username, password });
  }

  register(username: string, password: string, email:string, role:string, firstName: string, lastName:string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, { username, password, email, role, firstName, lastName });
  }
}