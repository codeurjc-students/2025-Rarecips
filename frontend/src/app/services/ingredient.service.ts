import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IngredientService {
  private apiUrl = '/api/v1/ingredients';

  constructor(private http: HttpClient) { }

  getAllIngredientNames(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/names`);
  }
}

