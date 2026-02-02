import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RecipeCollection } from '../models/recipe-collection.model';

@Injectable({
  providedIn: 'root'
})
export class RecipeCollectionService {
  private apiUrl = '/api/v1/collections';

  constructor(private http: HttpClient) {}

  getFavoritesCollection(username: string): Observable<RecipeCollection> {
    return this.http.get<RecipeCollection>(`${this.apiUrl}/liked?username=${username}`);
  }

  getFavoriteRecipeIds(username: string): Observable<number[]> {
    return this.getFavoritesCollection(username).pipe(
      map(collection => {
        if (!collection || !('recipes' in collection) || !collection.recipes) {
          return [] as number[];
        }
        return collection.recipes.map((r: any) => r.id).filter((id: any) => typeof id === 'number');
      })
    );
  }

  getCollectionById(id: number): Observable<RecipeCollection> {
    return this.http.get<RecipeCollection>(`${this.apiUrl}/${id}`);
  }

  createCollection(title: string): Observable<RecipeCollection> {
    return this.http.put<RecipeCollection>(this.apiUrl, { title });
  }

  addRecipeToCollection(collectionId: number, recipeId: number): Observable<RecipeCollection> {
    return this.http.put<RecipeCollection>(`${this.apiUrl}/${collectionId}?recipeId=${recipeId}`, {});
  }

  removeRecipeFromCollection(collectionId: number, recipeId: number): Observable<RecipeCollection> {
    return this.http.delete<RecipeCollection>(`${this.apiUrl}/${collectionId}?recipeId=${recipeId}`);
  }

  deleteCollection(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateCollectionTitle(id: number, title: string): Observable<RecipeCollection> {
    return this.http.put<RecipeCollection>(`${this.apiUrl}/${id}`, { title });
  }

  getAllUserCollections(username: string): Observable<RecipeCollection[]> {
    return this.http.get<RecipeCollection[]>(`${this.apiUrl}?username=${username}`);
  }

  addRecipeToFavorites(recipeId: number): Observable<RecipeCollection> {
    return this.http.put<RecipeCollection>(`${this.apiUrl}/liked?recipeId=${recipeId}`, {});
  }

  getPopularPublicCollections(limit: number = 10): Observable<RecipeCollection[]> {
    return this.http.get<RecipeCollection[]>(`${this.apiUrl}/public/popular?limit=${limit}`);
  }

  searchCollectionsPaged(q: string | null, page: number, size: number, sort?: string, direction?: string): Observable<{ content: RecipeCollection[]; total: number; last: boolean }> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    if (q && q.trim() !== '') {
      params = params.set('q', q);
    }
    if (sort) {
      params = params.set('sort', sort);
    }
    if (direction) {
      params = params.set('direction', direction);
    }
    return this.http.get<{ content: RecipeCollection[]; total: number; last: boolean }>(`${this.apiUrl}/search`, { params });
  }
}
