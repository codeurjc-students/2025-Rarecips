import {Injectable} from "@angular/core";
import {Recipe} from "../models/recipe.model";
import {Router} from "@angular/router";
import {HttpClient, HttpErrorResponse, HttpHeaders} from "@angular/common/http";
import {catchError, Observable, throwError} from "rxjs";

@Injectable({
  providedIn: "root"
})
export class RecipeService {

  API_URL = "/api/v1/recipes";
  size = 10;

  constructor(private router: Router, private httpClient: HttpClient) {
  }

  async getRecipes(page: number): Promise<Recipe[]> {
    this.httpClient.get(this.API_URL + `?order=lastmod&size=${this.size}&page=${page}`).pipe().subscribe();
    const response = await fetch(`${this.API_URL}?order=lastmod&size=${this.size}&page=${page}`);

    if (!response.ok) {
      this.router.navigate(['/error'], {state: {status: response.status, reason: response.statusText}});
      throw new Error(`Error fetching recipes: ${response.statusText}`);
    }
    const data = await response.json();
    return data.recipes.map((recipe: any) => ({
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
    }));
  }

  async getRecipeById(id: number): Promise<Recipe | null> {
    const response = await fetch(`${this.API_URL}/${id}`);
    if (response.status === 404) {
      return null;
    }
    const data = (await response.json()).recipe;
    return {
      id: data.id,
      label: data.label,
      title: data.label,
      description: data.description || "No description available.",
      imageUrl: data.imageString,
      imageString: data.imageString,
      people: data.people || 4,
      difficulty: data.difficulty || "Medium",
      ingredients: data.ingredients?.map((ing: any) => ({
        id: ing.id,
        food: ing.food,
        description: ing.food,
        quantity: data.ingredientQuantities?.[ing.id] || 0,
        measure: data.ingredientUnits?.[ing.id] || "",
        weight: data.ingredientQuantities?.[ing.id] || 0
      })) || [],
      dishTypes: data.dishTypes || [],
      mealTypes: data.mealTypes || [],
      cuisineType: data.cuisineType || [],
      dietLabels: data.dietLabels || [],
      healthLabels: data.healthLabels || [],
      cautions: data.cautions || [],
      totalTime: data.totalTime || 0,
      totalWeight: data.totalWeight || 0,
      calories: data.calories || 0,
      rating: data.rating || 0,
      author: data.author,
      reviews: data.reviews || [],
      steps: data.steps || [],
      createdAt: new Date(data.createdAt) || new Date(),
      updatedAt: new Date(data.updatedAt) || new Date()
    };
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

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'Unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
