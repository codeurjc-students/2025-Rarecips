import {Component} from '@angular/core';

interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

interface Instruction {
  step: number;
  description: string;
}

interface RecipeData {
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: string;
  category: string;
  image: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
  dietaryTags: string[];
  cuisineType: string;
}

@Component({
  selector: 'app-recipe-edit',
  templateUrl: './recipe-edit.component.html',
  styleUrls: ['./recipe-edit.component.css']
})
export class RecipeEditComponent {

  constructor() {
  }
}
