import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HealthReport } from '../models/health-report.model';

const BASE_URL = '/api/v1/health-reports';

@Injectable({
  providedIn: 'root'
})
export class HealthReportService {

  constructor(private http: HttpClient) { }

  getUserReports(): Observable<HealthReport[]> {
    return this.http.get<HealthReport[]>(BASE_URL);
  }

  generateReport(lang: string = 'es'): Observable<HealthReport> {
    return this.http.post<HealthReport>(`${BASE_URL}/generate?lang=${lang}`, {});
  }
}
