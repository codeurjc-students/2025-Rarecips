import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

export interface SystemStatus {
  server: string;
  database: string;
  mail: string;
  websockets: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private API_URL = '/api/v1/admin';

  constructor(private http: HttpClient) { }

  getSystemStatus(): Observable<SystemStatus> {
    return this.http.get<SystemStatus>(`${this.API_URL}/system-status`).pipe(
      catchError((error) => {
        console.error('Error fetching system status:', error);
        return throwError(() => new Error('Error fetching system status'));
      })
    );
  }

  getStats(range?: string): Observable<any> {
    let params = new HttpParams().set('_t', Date.now().toString());
    if (range) {
      params = params.set('range', range);
    }
    return this.http.get<any>(`${this.API_URL}/stats`, { params }).pipe(
      catchError((error) => {
        console.error('Error fetching stats:', error);
        return throwError(() => new Error('Error fetching stats'));
      })
    );
  }
}
