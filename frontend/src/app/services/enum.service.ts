import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RecipeAttribute {
  id?: number;
  name: string;
  type: string;
}

@Injectable({
  providedIn: 'root'
})
export class EnumService {
  private apiUrl = '/api/v1/enums';

  constructor(private http: HttpClient) {}

  getDifficultyLevels(): Observable<number[]> {
    return this.http.get<number[]>(`${this.apiUrl}/difficulty`);
  }

  getCuisineTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/cuisine-types`);
  }

  getCautions(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/cautions`);
  }

  getDietLabels(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/diet-labels`);
  }

  getDishTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/dish-types`);
  }

  getHealthLabels(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/health-labels`);
  }

  getMealTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/meal-types`);
  }

  getAllAttributes(): Observable<RecipeAttribute[]> {
    return this.http.get<RecipeAttribute[]>(`${this.apiUrl}/attributes`);
  }

  addAttribute(attribute: RecipeAttribute): Observable<RecipeAttribute> {
    return this.http.post<RecipeAttribute>(`${this.apiUrl}/attributes`, attribute);
  }

  updateAttribute(id: number, attribute: RecipeAttribute): Observable<RecipeAttribute> {
    return this.http.put<RecipeAttribute>(`${this.apiUrl}/attributes/${id}`, attribute);
  }

  deleteAttribute(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/attributes/${id}`);
  }
}


