import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ingredient } from '../models/ingredient.model';

export interface IngredientPageResponse {
  content: Ingredient[];
  last: boolean;
  totalPages: number;
  currentPage: number;
  totalElements: number;
}

@Injectable({
  providedIn: 'root'
})
export class IngredientService {
  private apiUrl = '/api/v1/ingredients';

  constructor(private http: HttpClient) { }

  getAllIngredientNames(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/names`);
  }

  getPagedIngredients(page: number, size: number): Observable<IngredientPageResponse> {
    return this.http.get<IngredientPageResponse>(`${this.apiUrl}?page=${page}&size=${size}`);
  }
}
