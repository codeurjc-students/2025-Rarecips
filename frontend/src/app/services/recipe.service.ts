import {Injectable} from "@angular/core";
import {Recipe} from "../models/recipe.model";
import {Router} from "@angular/router";
import {HttpClient} from "@angular/common/http";

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
      title: recipe.label,
      description: recipe.description || "No description available.",
      imageUrl: recipe.imageString,
      people: recipe.people || 4,
      difficulty: recipe.difficulty || "Medium",
      ingredients: recipe.ingredients || [],
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
      title: data.label,
      description: data.description || "No description available.",
      imageUrl: data.imageString,
      people: data.people || 4,
      difficulty: data.difficulty || "Medium",
      ingredients: data.ingredients || [],
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
}
