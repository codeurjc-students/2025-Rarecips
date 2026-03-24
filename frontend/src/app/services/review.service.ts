import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {catchError} from 'rxjs/operators';
import {Observable, throwError} from 'rxjs';

@Injectable({
  providedIn: "root"
})
export class ReviewService {
  API_URL = "/api/v1/reviews";

  constructor(private router: Router, private httpClient: HttpClient) {
  }

  submitReview(reviewData: any): Observable<any> {
    return this.httpClient.put(this.API_URL, reviewData).pipe(
      catchError((error: any) => {
        this.router.navigate(['/error'], {state: {status: error.status, reason: error.statusText}});
        return throwError(() => new Error(`Error submitting review: ${error.statusText}`));
      })
    );
  }

  getReviewsByRecipeId(recipeId: number | undefined, page: number, size: number): Observable<any> {
    return this.httpClient.get(`${this.API_URL}?recipeId=${recipeId}&page=${page}&size=${size}`).pipe(
      catchError((error: any) => {
        return throwError(() => new Error(`Error loading reviews: ${error.statusText}`));
      })
    );
  }


  deleteReview(reviewId: string): Observable<any> {
    return this.httpClient.delete(`${this.API_URL}/${reviewId}`).pipe(
      catchError((error: any) => {
        this.router.navigate(['/error'], {state: {status: error.status, reason: error.statusText}});
        return throwError(() => new Error(`Error deleting review: ${error.statusText}`));
      })
    );
  }

  reportReview(reviewId: number | string): Observable<any> {
    return this.httpClient.put(`${this.API_URL}/${reviewId}/report`, null);
  }

  getReportedReviews(page: number, size: number): Observable<any> {
    const params = { page: page.toString(), size: size.toString() };
    return this.httpClient.get<any>(`${this.API_URL}/reported`, { params }).pipe(
      catchError((error: any) => {
        return throwError(() => new Error(`Error fetching reported reviews: ${error.statusText}`));
      })
    );
  }

  dismissReport(reviewId: number | string): Observable<any> {
    return this.httpClient.put(`${this.API_URL}/${reviewId}/dismiss-report`, null);
  }
}
