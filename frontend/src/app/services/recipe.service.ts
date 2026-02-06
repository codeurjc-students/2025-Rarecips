import {Injectable} from "@angular/core";
import {Recipe} from "../models/recipe.model";
import {Router} from "@angular/router";
import {HttpClient, HttpErrorResponse, HttpParams} from "@angular/common/http";
import {catchError, map, Observable, throwError, tap, switchMap} from "rxjs";

@Injectable({
  providedIn: "root"
})
export class RecipeService {

  API_URL = "/api/v1/recipes";
  size = 9;

  constructor(private router: Router, private httpClient: HttpClient) {
  }

  getRecipes(page: number): Observable<Recipe[]> {
    return this.httpClient.get<any>(`${this.API_URL}/search?page=${page}&size=${this.size}`).pipe(
      map(data => data.recipes.map((recipe: any) => this.mapRecipe(recipe))),
      catchError(this.handleError)
    );
  }

  getFilteredRecipes(filters: any, page: number = 0, size: number = 10): Observable<any> {
    let params = new HttpParams();

    if (filters.query) params = params.append('query', filters.query);
    if (filters.cuisines?.length > 0) filters.cuisines.forEach((c: string) => params = params.append('cuisines', c));
    if (filters.mealTypes?.length > 0) filters.mealTypes.forEach((m: string) => params = params.append('mealTypes', m));
    if (filters.dishTypes?.length > 0) filters.dishTypes.forEach((d: string) => params = params.append('dishTypes', d));
    if (filters.dietLabels?.length > 0) filters.dietLabels.forEach((dl: string) => params = params.append('dietLabels', dl));
    if (filters.healthLabels?.length > 0) filters.healthLabels.forEach((hl: string) => params = params.append('healthLabels', hl));
    if (filters.difficulties?.length > 0) filters.difficulties.forEach((diff: number) => params = params.append('difficulties', diff.toString()));
    if (filters.minRating) params = params.append('minRating', filters.minRating.toString());
    if (filters.minTime) params = params.append('minTime', filters.minTime.toString());
    if (filters.maxTime) params = params.append('maxTime', filters.maxTime.toString());
    if (filters.minCalories) params = params.append('minCalories', filters.minCalories.toString());
    if (filters.maxCalories) params = params.append('maxCalories', filters.maxCalories.toString());
    if (filters.minWeight) params = params.append('minWeight', filters.minWeight.toString());
    if (filters.maxWeight) params = params.append('maxWeight', filters.maxWeight.toString());
    if (filters.minPeople) params = params.append('minPeople', filters.minPeople.toString());
    if (filters.maxPeople) params = params.append('maxPeople', filters.maxPeople.toString());
    if (filters.onlyUserIngredients) params = params.append('onlyUserIngredients', 'true');
    if (filters.userIngredientIds?.length > 0) {
      filters.userIngredientIds.forEach((id: number) => params = params.append('userIngredientIds', id.toString()));
    }
    params = params.append('page', page.toString());
    params = params.append('size', size.toString());
    if (filters.sortBy) params = params.append('sortBy', filters.sortBy);

    return this.httpClient.get<any>(`${this.API_URL}/filter`, { params }).pipe(
      map(data => ({
        recipes: data.recipes.map((recipe: any) => this.mapRecipe(recipe)),
        total: data.total,
        page: data.page,
        size: data.size
      })),
      catchError(this.handleError)
    );
  }

  private mapRecipe(recipe: any): Recipe {
    return {
      id: recipe.id,
      label: recipe.label,
      title: recipe.label,
      description: recipe.description || "No description available.",
      imageUrl: recipe.imageString,
      imageString: recipe.imageString,
      people: recipe.people || 4,
      difficulty: recipe.difficulty || 1,
      ingredients: recipe.ingredients?.map((ing: any) => ({
        id: ing.id,
        food: ing.food,
        description: ing.food,
        quantity: recipe.ingredientQuantities?.[ing.id] || 0,
        measure: recipe.ingredientUnits?.[ing.id] || "",
        weight: recipe.ingredientQuantities?.[ing.id] || 0
      })) || [],
      dishTypes: recipe.dishTypes || [],
      mealTypes: recipe.mealTypes || [],
      cuisineType: recipe.cuisineType || [],
      dietLabels: recipe.dietLabels || [],
      healthLabels: recipe.healthLabels || [],
      cautions: recipe.cautions || [],
      totalTime: recipe.totalTime || 0,
      totalWeight: recipe.totalWeight || 0,
      calories: recipe.calories || 0,
      rating: recipe.rating || 0,
      author: recipe.author || "",
      reviews: recipe.reviews || [],
      steps: recipe.steps || [],
      createdAt: new Date(recipe.createdAt) || new Date(),
      updatedAt: new Date(recipe.updatedAt) || new Date()
    };
  }

  getRecipeById(id: number): Observable<Recipe | null> {
    return this.httpClient.get<any>(`${this.API_URL}/${id}`).pipe(
      map(response => {
        const data = response.recipe;
        return this.mapRecipe(data);
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          return throwError(() => null);
        }
        return this.handleError(error);
      })
    );
  }

  createRecipe(recipeData: any): Observable<any> {
    return this.httpClient.put(`${this.API_URL}`, recipeData).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  updateRecipe(id: number, recipeData: any): Observable<any> {
    return this.httpClient.put(`${this.API_URL}/${id}`, recipeData).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  deleteRecipe(id: number): Observable<any> {
    return this.httpClient.delete(`${this.API_URL}/${id}`).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  getRecipeCountByDishType(dishType: string): Observable<any> {
    const params = new HttpParams().set('dishType', dishType);
    return this.httpClient.get<any>(`${this.API_URL}/search/count-by-dish-type`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  getRecipeCountByMealType(mealType: string): Observable<any> {
    const params = new HttpParams().set('mealType', mealType);
    return this.httpClient.get<any>(`${this.API_URL}/search/count`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'Unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      this.router.navigate(['/error'], { queryParams: { code: error.status, message: error.message } });
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  getDefaultRecipeImageUrl() {
    return this.httpClient.get('/assets/img/recipe.png', { responseType: 'blob' }).pipe(
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
}
