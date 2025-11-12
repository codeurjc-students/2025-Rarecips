import { User } from "../models/user.model";
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, map, Observable, of, throwError } from "rxjs";

@Injectable({
    providedIn: "root"
})
export class SessionService {
    private baseUrl = "/api/v1/auth/";
    private userUrl = "/api/v1/user/";

    isLogged: boolean = false;
    currentUser: User | undefined;

    constructor(private httpClient: HttpClient) { }

    checkLoggedIn(): Observable<boolean> {
        return this.httpClient.get<User>(this.userUrl + "me", {withCredentials: true}).pipe(
            map(() => {
                this.isLogged = true;
                return true;
            }),
            catchError(error => {
                if (error.status === 401) {
                this.isLogged = false;
                this.currentUser = undefined;
                return of(false);
                } else {
                return this.handleError(error);
                }
            })
        );
    }

    login(user: {username: string, password: string, rememberMe: boolean}): Observable<any> {
        return this.httpClient.put(this.baseUrl + "login", user, {withCredentials: true}).pipe(
            catchError(error => this.handleError(error))
        );
    }

    signup(user: {username: string, email: string, password: string}): Observable<any> {
        return this.httpClient.put(this.baseUrl + "signup", user, {withCredentials: true}).pipe(
            catchError(error => this.handleError(error))
        );
    }

    logout(): Observable<any> {
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


    // Custom error
    private handleError(error: any): Observable<never> {
        console.error("An error occurred:", error);
        return throwError(() => new Error("Server error (" + error.status + "): " + error.statusText + ")"));
    }


}