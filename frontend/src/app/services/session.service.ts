import {User} from "../models/user.model";
import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {catchError, map, Observable, of, throwError} from "rxjs";

@Injectable({
  providedIn: "root"
})
export class SessionService {
  private baseUrl = "/api/v1/auth/";
  private userUrl = "/api/v1/users/";

  isLogged: boolean = false;
  currentUser: User | undefined;

  constructor(private httpClient: HttpClient) {
  }

  login(user: { username: string, password: string, rememberMe: boolean }): Observable<any> {
    return this.httpClient.put(this.baseUrl + "login", user, {withCredentials: true}).pipe(
      catchError(error => this.handleError(error))
    );
  }

  signup(user: { username: string, email: string, password: string,
    preferences: object }): Observable<any> {
    return this.httpClient.put(this.baseUrl + "signup", user, {withCredentials: true}).pipe(
      catchError(error => this.handleError(error))
    );
  }

  logout(): Observable<any> {
    // Update last seen before logging out
    this.httpClient.put(this.userUrl + "me/last-online", {}, {withCredentials: true}).subscribe();
    return this.httpClient.put(this.baseUrl + "logout", {}, {withCredentials: true}).pipe(
      catchError(error => this.handleError(error))
    );
  }

  getLoggedUser(): Observable<User> {
    return this.httpClient.get<User>(this.userUrl + "me", {withCredentials: true}).pipe(
      catchError(error => this.handleError(error))
    );
  }

  isAdmin(): Observable<boolean> {
    return this.httpClient.get<User>(this.userUrl + "me", {withCredentials: true}).pipe(
      map(user => user.role === "admin"),
      catchError(error => this.handleError(error))
    );
  }

  getUsernameList(): Observable<string[]> {
    return this.httpClient.get<string[]>(this.baseUrl + "usernames").pipe(
      catchError(() => of([]))
    );
  }

  isEmailAvailable(email: string): Observable<boolean> {
    return this.httpClient.get<boolean>(this.baseUrl + `emails?email=${email}`).pipe(
      catchError(() => of(false))
    );
  }


  // Custom error
  private handleError(error: any): Observable<never> {
    console.error("An error occurred:", error);
    return throwError(() => new Error("Server error (" + error.status + "): " + error.statusText + ")"));
  }


}
