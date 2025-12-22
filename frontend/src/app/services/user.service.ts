import {Injectable} from "@angular/core";
import {Router} from "@angular/router";
import {HttpClient} from "@angular/common/http";
import {catchError, Observable, throwError} from "rxjs";
import {Ingredient} from '../models/ingredient.model';

@Injectable({
  providedIn: "root"
})
export class UserService {

  API_URL = "/api/v1/users";

  constructor(private router: Router, private httpClient: HttpClient) {
  }

  getUserByUsername(username: string): Observable<any> {
    return this.httpClient.get(`${this.API_URL}/${username}`).pipe(
      catchError((error: any) => {
        this.router.navigate(['/error'], {state: {status: error.status, reason: error.statusText}});
        return throwError(() => new Error(`Error fetching user: ${error.statusText}`));
      })
    );
  }

  getUserIngredients(username: string): Observable<any> {
    return this.httpClient.get(`${this.API_URL}/me/ingredients`).pipe(
      catchError((error: any) => {
        this.router.navigate(['/error'], {state: {status: error.status, reason: error.statusText}});
        return throwError(() => new Error(`Error fetching user ingredients: ${error.statusText}`));
      })
    );
  }


  updateUser(username: string, userData: any): Observable<any> {
    return this.httpClient.put(`${this.API_URL}/${username}`, userData).pipe(
      catchError((error: any) => {
        this.router.navigate(['/error'], {state: {status: error.status, reason: error.statusText}});
        return throwError(() => new Error(`Error updating user: ${error.statusText}`));
      })
    );
  }

  addIngredient(ingredient: Ingredient): Observable<any> {
    this.httpClient.put(`${this.API_URL}/me/ingredients`, ingredient).pipe(
      catchError((error: any) => {
        this.router.navigate(['/error'], {state: {status: error.status, reason: error.statusText}});
        return throwError(() => new Error(`Error adding ingredient: ${error.statusText}`));
      })
    );
    return this.httpClient.put(`${this.API_URL}/me/ingredients`, ingredient);
  }

  removeIngredient(ingredient: Ingredient): Observable<any> {
    return this.httpClient.put(`${this.API_URL}/me/ingredients/remove`, ingredient.id).pipe(
      catchError((error: any) => {
        this.router.navigate(['/error'], {state: {status: error.status, reason: error.statusText}});
        return throwError(() => new Error(`Error removing ingredient: ${error.statusText}`));
      })
    );
  }

  clearPantry(): Observable<any> {
    return this.httpClient.put(`${this.API_URL}/me/ingredients/clear`, null).pipe(
      catchError((error: any) => {
        this.router.navigate(['/error'], {state: {status: error.status, reason: error.statusText}});
        return throwError(() => new Error(`Error clearing pantry: ${error.statusText}`));
      })
    );
  }

  searchUsers(query: string, page: number, size: number): Observable<any> {
    const params: any = {page, size};
    if (query) params.query = query;

    return this.httpClient.get(`${this.API_URL}/search`, {params}).pipe(
      catchError((error: any) => {
        return throwError(() => new Error(`Error searching users: ${error.statusText}`));
      })
    );
  }

  filterUsers(filterParams: any, page: number, size: number): Observable<any> {
    const params: any = {page, size, ...filterParams};

    return this.httpClient.get(`${this.API_URL}/filter`, {params}).pipe(
      catchError((error: any) => {
        return throwError(() => new Error(`Error filtering users: ${error.statusText}`));
      })
    );
  }
}
