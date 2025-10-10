import { Injectable } from "@angular/core";
import { Recipe } from "../models/recipe.model";

@Injectable({
    providedIn: "root"
})
export class RecipeService {
    constructor() { }

    async getRecipes(page: number): Promise<Recipe[]> {
        const size = 3;
        const response = await fetch(`/api/recipes?order=lastmod&size=${size}&page=${page}`);
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
        const response = await fetch(`/api/recipes/${id}`);
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