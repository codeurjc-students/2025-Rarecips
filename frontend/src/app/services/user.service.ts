import {Injectable} from "@angular/core";
import {Router} from "@angular/router";
import {HttpClient} from "@angular/common/http";
import {catchError, Observable, switchMap, throwError} from "rxjs";
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
        console.error(error)
        if (error.status != 403) this.router.navigate(['/error'], {state: {status: error.status, reason: error.statusText}});
        return throwError(() => new Error(`Error fetching user: ${error.statusText}`));
      })
    );
  }

  getDefaultPfp(): Observable<any> {
    return this.httpClient.get('/assets/img/user.png', { responseType: 'blob' }).pipe(
      switchMap(blob => {
        return new Observable<string>(observer => {
          const reader = new FileReader();
          reader.onloadend = () => {
            observer.next(reader.result as string);
            observer.complete();
          };
          reader.onerror = (err) => observer.error(err);
          reader.readAsDataURL(blob);
        });
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
    if (filterParams.sortBy === 'username') {
      filterParams.direction = 'asc';
    } else if (filterParams.sortBy === 'createdAt' && !filterParams.direction) {
      filterParams.direction = 'desc';
    }
    const params: any = {page, size, ...filterParams};
    return this.httpClient.get(`${this.API_URL}/filter`, {params}).pipe(
      catchError((error: any) => {
        return throwError(() => new Error(`Error filtering users: ${error.statusText}`));
      })
    );
  }

  getUserRecipes(username: string, page: number = 0, size: number = 10): Observable<any> {
    const params = {display: 'recipes', page: page.toString(), size: size.toString()};
    return this.httpClient.get(`${this.API_URL}/${username}`, {params}).pipe(
      catchError((error: any) => {
        return throwError(() => new Error(`Error fetching user recipes: ${error.statusText}`));
      })
    );
  }

  getUserReviews(username: string, page: number = 0, size: number = 10): Observable<any> {
    const params = {display: 'reviews', page: page.toString(), size: size.toString()};
    return this.httpClient.get(`${this.API_URL}/${username}`, {params}).pipe(
      catchError((error: any) => {
        return throwError(() => new Error(`Error fetching user reviews: ${error.statusText}`));
      })
    );
  }

  getUserCollections(username: string, page: number = 0, size: number = 10): Observable<any> {
    const params = {display: 'collections', page: page.toString(), size: size.toString()};
    return this.httpClient.get(`${this.API_URL}/${username}`, {params}).pipe(
      catchError((error: any) => {
        return throwError(() => new Error(`Error fetching user collections: ${error.statusText}`));
      })
    );
  }

  getUserIngredientsPaginated(username: string, page: number = 0, size: number = 10): Observable<any> {
    const params = {display: 'ingredients', page: page.toString(), size: size.toString()};
    return this.httpClient.get(`${this.API_URL}/${username}`, {params}).pipe(
      catchError((error: any) => {
        return throwError(() => new Error(`Error fetching user ingredients: ${error.statusText}`));
      })
    );
  }

  deleteCurrentUser(): Observable<any> {
    return this.httpClient.delete(`${this.API_URL}/me`).pipe(
      catchError((error: any) => {
        return throwError(() => new Error(`Error deleting user: ${error.statusText}`));
      })
    );
  }

  deleteUserByUsername(usernamePath: string) {
    return this.httpClient.delete(`${this.API_URL}/${usernamePath}`, { responseType: 'text' }).pipe(
      catchError((error: any) => {
        return throwError(() => new Error(`Error deleting user: ${error.statusText}`));
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Observable<any> {
    return this.httpClient.put(`${this.API_URL}/me/password`, {
      currentPassword,
      newPassword,
      confirmPassword
    }, { responseType: 'text' }).pipe(
      catchError((error: any) => {
        return throwError(() => error);
      })
    );
  }

  changePasswordForUserAsAdmin(usernamePath: string, currentPassword: string, newPassword: string, confirmPassword: string) {
    return this.httpClient.put(`${this.API_URL}/${usernamePath}/password`, {
      currentPassword,
      newPassword,
      confirmPassword
    }, { responseType: 'text' }).pipe(
      catchError((error: any) => {
        return throwError(() => error);
      })
    );
  }

  sendPasswordRecoveryEmail(email: string): Observable<any> {
    return this.httpClient.post(`${this.API_URL}/change-password`, { email, theme: localStorage.getItem("selectedTheme"), lang: localStorage.getItem("lang") });
  }

  changePasswordWithToken(token: string, newPassword: string, confirmPassword: string): Observable<any> {
    return this.httpClient.post(`${this.API_URL}/change-password`, {
      token,
      newPassword,
      confirmPassword
    }, { responseType: 'text' });
  }
}
