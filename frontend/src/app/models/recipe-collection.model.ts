import {Recipe} from "./recipe.model";

export interface RecipeCollection {
  id: number;
  title: string;
  author: string;
  isFavorites: boolean;
  recipes: Recipe[];
  createdAt: Date;
  updatedAt: Date;
  recipeCount: number;
}

