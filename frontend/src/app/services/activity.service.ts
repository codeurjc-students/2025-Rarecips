import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {

  private apiUrl = '/api/v1';

  constructor(private http: HttpClient) { }

  public getLatestActivities(limit: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/activities/latest?limit=${limit}`);
  }

  public getLatestReviews(limit: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/activities/latest-reviews?limit=${limit}`);
  }

  public getRelativeTime(relativeDate: Intl.RelativeTimeFormat,  diffMs: number): string {
    let mode, count;
    if (diffMs < 60 * 1000) {
      mode = "second";
      count = -Math.round(diffMs / 1000);
    } else if (diffMs < 60 * 60 * 1000) {
      mode = "minute";
      count = -Math.round(diffMs / (60 * 1000));
    } else if (diffMs < 24 * 60 * 60 * 1000) {
      mode = "hour";
      count = -Math.round(diffMs / (60 * 60 * 1000));
    } else if (diffMs < 30 * 24 * 60 * 60 * 1000) {
      mode = "day";
      count = -Math.round(diffMs / (24 * 60 * 60 * 1000));
    } else if (diffMs < 365 * 24 * 60 * 60 * 1000) {
      mode = "month";
      count = -Math.round(diffMs / (30 * 24 * 60 * 60 * 1000));
    } else {
      mode = "year";
      count = -Math.round(diffMs / (365 * 24 * 60 * 60 * 1000));
    }
    return relativeDate.format(count, (mode as Intl.RelativeTimeFormatUnit));
  }
}

