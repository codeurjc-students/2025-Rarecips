import {Injectable} from "@angular/core";
import {Router} from "@angular/router";

@Injectable({
  providedIn: "root"
})
export class UserService {

  API_URL = "/api/v1/users";

  constructor(private router: Router) {
  }

  getUserByUsername(username: string): Promise<any> {
    return fetch(`${this.API_URL}/${username}`).then(async response => {
      if (!response.ok) {
        this.router.navigate(['/error'], {state: {status: response.status, reason: response.statusText}});
        throw new Error(`Error fetching user: ${response.statusText}`);
      }
      return await response.json();
    });
  }

}
