import {Injectable} from "@angular/core";
import {Router} from "@angular/router";
import {HttpClient} from "@angular/common/http";
import {catchError, Observable, throwError} from "rxjs";

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


  updateUser(username: string, userData: any): Observable<any> {
    return this.httpClient.put(`${this.API_URL}/${username}`, userData).pipe(
      catchError((error: any) => {
        this.router.navigate(['/error'], {state: {status: error.status, reason: error.statusText}});
        return throwError(() => new Error(`Error updating user: ${error.statusText}`));
      })
    );
  }

}
